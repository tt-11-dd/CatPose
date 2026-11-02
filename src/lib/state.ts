import { useSyncExternalStore } from "react";
import type { CatSlug, Draft, Profile, Sticker, User } from "../types";
import { api, apiAvailable, fetchStickerBlobs } from "./api";
import * as db from "./db";
import { uid } from "./id";
import { resizeForProcess, validateImage } from "./image";
import { removeBackground } from "./remove-bg";
import { generateSticker, isolateSubject } from "./sticker";

type Snapshot = {
  stickers: Sticker[];
  profile: Profile;
  user: User | null;
  cloud: boolean;
  selectedCat: CatSlug;
  draft: Draft | null;
  ready: boolean;
};

const CAT_KEY = "catpose.cat";

function readSavedCat(): CatSlug {
  try {
    const v = localStorage.getItem(CAT_KEY);
    if (v === "yidian" || v === "shiyi") return v;
  } catch {
    /* ignore */
  }
  return "yidian";
}

let snap: Snapshot = {
  stickers: [],
  profile: { nickname: "猫奴" },
  user: null,
  cloud: false,
  selectedCat: "yidian",
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
  const selectedCat = readSavedCat();
  try {
    const cloud = await apiAvailable();
    if (cloud) {
      try {
        const me = await api.me();
        const rows = await api.listStickers();
        const stickers = await Promise.all(
          rows.map(async (row) => {
            const files = await fetchStickerBlobs(row.id);
            return {
              id: row.id,
              title: row.title,
              catId: row.cat_slug,
              width: row.width,
              height: row.height,
              status: "completed" as const,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              ...files,
            };
          }),
        );
        snap = {
          ...snap,
          cloud: true,
          user: me,
          profile: { nickname: me.nickname },
          stickers,
          selectedCat,
          ready: true,
        };
        emit();
        return;
      } catch {
        snap = { ...snap, cloud: true, user: null, selectedCat, ready: true };
        emit();
        return;
      }
    }
    const [stickers, profile] = await Promise.all([db.listStickers(), db.getProfile()]);
    snap = { ...snap, stickers, profile, selectedCat, cloud: false, ready: true };
  } catch (err) {
    console.error(err);
    snap = { ...snap, selectedCat, ready: true };
  }
  emit();
}

export function useApp(): Snapshot {
  return useSyncExternalStore(subscribe, () => snap, () => snap);
}

export function setSelectedCat(catId: CatSlug) {
  try {
    localStorage.setItem(CAT_KEY, catId);
  } catch {
    /* ignore */
  }
  snap = { ...snap, selectedCat: catId };
  emit();
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

function emptyDraft(file: Blob, extra: Partial<Draft>): Draft {
  return {
    original: file,
    cutout: null,
    sticker: null,
    title: "",
    catId: snap.selectedCat,
    status: "processing",
    progress: "",
    progressRatio: 0,
    error: null,
    ...extra,
  };
}

export async function startFromFile(file: Blob): Promise<void> {
  const code = validateImage(file);
  if (code) {
    setDraft(
      emptyDraft(file, {
        status: "failed",
        error: code === "IMAGE_TOO_LARGE" ? "图片太大了，换一张 15MB 以内的吧" : "只支持 JPG / PNG / WebP",
      }),
    );
    return;
  }
  setDraft(emptyDraft(file, { status: "processing", progress: "准备照片…", progressRatio: 0.02 }));
  void processDraft();
}

export async function processDraft(): Promise<void> {
  const draft = snap.draft;
  if (!draft) return;
  patchDraft({ status: "processing", error: null, progress: "压缩照片…", progressRatio: 0.04 });
  try {
    const resized = await resizeForProcess(draft.original);
    const raw = await removeBackground(resized, (progress, progressRatio) =>
      patchDraft({ progress, progressRatio }),
    );
    patchDraft({ progress: "去掉旁边多抠进来的东西…", progressRatio: 0.94 });
    const cutout = await isolateSubject(raw);
    patchDraft({ progress: "画上白边和阴影…", progressRatio: 0.97, cutout });
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
      progressRatio: 0,
    });
  }
}

let savingDraft = false;

export async function saveDraft(): Promise<string | null> {
  const draft = snap.draft;
  if (savingDraft || !draft?.cutout || !draft.sticker) return null;
  savingDraft = true;
  try {
    const bmp = await createImageBitmap(draft.sticker);
    const catId = draft.catId;
    const title = draft.title.trim() || `${catId === "shiyi" ? "十一" : "一点"}的贴纸`;
    let id = uid("sticker");
    if (snap.user) {
      const uploaded = await api.uploadSticker({
        catSlug: catId,
        title,
        width: bmp.width,
        height: bmp.height,
        original: draft.original,
        cutout: draft.cutout,
        sticker: draft.sticker,
      });
      id = uploaded.id;
    }
    const sticker: Sticker = {
      id,
      title,
      catId,
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
    if (!snap.user) await db.putSticker(sticker);
    snap = {
      ...snap,
      stickers: [sticker, ...snap.stickers],
      draft: null,
    };
    emit();
    return sticker.id;
  } finally {
    savingDraft = false;
  }
}

const removing = new Set<string>();

export async function removeSticker(id: string): Promise<void> {
  if (removing.has(id)) return;
  removing.add(id);
  try {
    if (snap.user) await api.deleteSticker(id);
    else await db.deleteSticker(id);
    snap = { ...snap, stickers: snap.stickers.filter((s) => s.id !== id) };
    emit();
  } finally {
    removing.delete(id);
  }
}

export async function updateSticker(
  id: string,
  patch: Partial<Pick<Sticker, "title" | "catId">>,
): Promise<void> {
  const current = snap.stickers.find((s) => s.id === id);
  if (!current) return;
  const next = { ...current, ...patch, updatedAt: Date.now() };
  if (snap.user) await api.patchSticker(id, { title: next.title, catSlug: next.catId });
  else await db.putSticker(next);
  snap = {
    ...snap,
    stickers: snap.stickers.map((s) => (s.id === id ? next : s)),
  };
  emit();
}

export async function saveProfile(profile: Profile): Promise<void> {
  if (snap.user) {
    const me = await api.patchMe(profile.nickname);
    snap = { ...snap, profile, user: { ...snap.user, nickname: me.nickname } };
  } else {
    await db.setProfile(profile);
    snap = { ...snap, profile };
  }
  emit();
}

export async function login(email: string, password: string): Promise<void> {
  await api.login(email, password);
  await boot();
}

export async function register(email: string, password: string, nickname?: string): Promise<void> {
  await api.register(email, password, nickname);
  await boot();
}

export async function logout(): Promise<void> {
  try {
    await api.logout();
  } catch {
    /* ignore */
  }
  const [stickers, profile] = await Promise.all([db.listStickers(), db.getProfile()]);
  snap = {
    ...snap,
    user: null,
    stickers,
    profile,
    draft: null,
  };
  emit();
}

export async function resetAll(): Promise<void> {
  await db.clearStickers();
  if (!snap.user) {
    snap = { ...snap, stickers: [] };
    emit();
  }
}

export function stickersOf(cat: CatSlug | "all", stickers: Sticker[]): Sticker[] {
  if (cat === "all") return stickers;
  return stickers.filter((s) => s.catId === cat);
}
