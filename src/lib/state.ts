import { useSyncExternalStore } from "react";
import type { CategoryId, Draft, Profile, Sticker } from "../types";
import * as db from "./db";
import { uid } from "./id";
import { resizeForProcess, validateImage } from "./image";
import { removeBackground } from "./remove-bg";
import { generateSticker } from "./sticker";

type Snapshot = {
  stickers: Sticker[];
  profile: Profile;
  draft: Draft | null;
  ready: boolean;
};

let snap: Snapshot = {
  stickers: [],
  profile: { nickname: "猫奴" },
  draft: null,
  ready: false,
};

const listeners = new Set<() => void>();

function emit() {
  snap = { ...snap };
  for (const l of listeners) l();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function boot(): Promise<void> {
  try {
    const [stickers, profile] = await Promise.all([db.listStickers(), db.getProfile()]);
    snap = { ...snap, stickers, profile, ready: true };
  } catch (err) {
    console.error(err);
    snap = { ...snap, ready: true };
  }
  emit();
}

export function useApp(): Snapshot {
  return useSyncExternalStore(subscribe, () => snap, () => snap);
}

export function setDraft(draft: Draft | null) {
  snap = { ...snap, draft };
  emit();
}

export function patchDraft(partial: Partial<Draft>) {
  if (!snap.draft) return;
  snap = { ...snap, draft: { ...snap.draft, ...partial } };
  emit();
}

export async function startFromFile(file: Blob): Promise<void> {
  const code = validateImage(file);
  if (code) {
    setDraft({
      original: file,
      cutout: null,
      sticker: null,
      title: "猫咪姿势",
      categoryId: "other",
      status: "failed",
      progress: "",
      error: code === "IMAGE_TOO_LARGE" ? "图片太大了，换一张 15MB 以内的吧" : "只支持 JPG / PNG / WebP",
    });
    return;
  }
  setDraft({
    original: file,
    cutout: null,
    sticker: null,
    title: "猫咪姿势",
    categoryId: "other",
    status: "processing",
    progress: "准备照片…",
    error: null,
  });
  void processDraft();
}

export async function processDraft(): Promise<void> {
  const draft = snap.draft;
  if (!draft) return;
  patchDraft({ status: "processing", error: null, progress: "压缩照片…" });
  try {
    const resized = await resizeForProcess(draft.original);
    const cutout = await removeBackground(resized, (progress) => patchDraft({ progress }));
    patchDraft({ progress: "画上白边和阴影…", cutout });
    const sticker = await generateSticker(cutout);
    patchDraft({
      cutout,
      sticker: sticker.blob,
      status: "editing",
      progress: "",
    });
  } catch (err) {
    console.error(err);
    patchDraft({
      status: "failed",
      error: "抠图失败了，换张猫咪更清楚的照片再试一次",
      progress: "",
    });
  }
}

export async function saveDraft(): Promise<string | null> {
  const draft = snap.draft;
  if (!draft?.cutout || !draft.sticker) return null;
  const bmp = await createImageBitmap(draft.sticker);
  const sticker: Sticker = {
    id: uid("sticker"),
    title: draft.title.trim() || "猫咪姿势",
    categoryId: draft.categoryId,
    width: bmp.width,
    height: bmp.height,
    status: "completed",
    original: draft.original,
    cutout: draft.cutout,
    sticker: draft.sticker,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  bmp.close();
  await db.putSticker(sticker);
  snap = {
    ...snap,
    stickers: [sticker, ...snap.stickers],
    draft: null,
  };
  emit();
  return sticker.id;
}

export async function removeSticker(id: string): Promise<void> {
  await db.deleteSticker(id);
  snap = { ...snap, stickers: snap.stickers.filter((s) => s.id !== id) };
  emit();
}

export async function updateSticker(
  id: string,
  patch: Partial<Pick<Sticker, "title" | "categoryId">>,
): Promise<void> {
  const current = snap.stickers.find((s) => s.id === id);
  if (!current) return;
  const next = { ...current, ...patch, updatedAt: Date.now() };
  await db.putSticker(next);
  snap = {
    ...snap,
    stickers: snap.stickers.map((s) => (s.id === id ? next : s)),
  };
  emit();
}

export async function saveProfile(profile: Profile): Promise<void> {
  await db.setProfile(profile);
  snap = { ...snap, profile };
  emit();
}

export async function resetAll(): Promise<void> {
  await db.clearStickers();
  snap = { ...snap, stickers: [] };
  emit();
}

export function categoryOf(id: CategoryId | "all", stickers: Sticker[]): Sticker[] {
  if (id === "all") return stickers;
  if (id === "other") {
    const main = new Set(["sitting", "lying", "jumping"]);
    return stickers.filter((s) => !main.has(s.categoryId) || s.categoryId === "other");
  }
  return stickers.filter((s) => s.categoryId === id);
}
