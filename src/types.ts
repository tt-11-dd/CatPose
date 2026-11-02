export const CATS = [
  { slug: "yidian", name: "一点" },
  { slug: "shiyi", name: "十一" },
] as const;

export type CatSlug = (typeof CATS)[number]["slug"];

export const ACHIEVEMENTS = [
  { id: "beginner", name: "初级猫奴", need: 1 },
  { id: "senior", name: "资深猫奴", need: 25 },
  { id: "master", name: "猫咪大师", need: 50 },
] as const;

export const POSE_GOAL = 50;

export type StickerStatus =
  | "uploaded"
  | "processing"
  | "editing"
  | "completed"
  | "failed";

export type Sticker = {
  id: string;
  title: string;
  catId: CatSlug;
  width: number;
  height: number;
  status: StickerStatus;
  original: Blob;
  cutout: Blob;
  sticker: Blob;
  createdAt: number;
  updatedAt: number;
};

export type User = {
  id: string;
  email: string;
  nickname: string;
};

export type Profile = {
  nickname: string;
};

export type DraftStatus = "processing" | "editing" | "failed";

export type Draft = {
  original: Blob;
  cutout: Blob | null;
  sticker: Blob | null;
  title: string;
  catId: CatSlug;
  status: DraftStatus;
  progress: string;
  progressRatio: number;
  error: string | null;
};

export function catName(slug: string): string {
  return CATS.find((c) => c.slug === slug)?.name ?? "猫咪";
}
