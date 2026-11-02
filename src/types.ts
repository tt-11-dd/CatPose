export const CATEGORIES = [
  { id: "sitting", name: "坐姿", slug: "sitting" },
  { id: "lying", name: "趴着", slug: "lying" },
  { id: "sleeping", name: "睡姿", slug: "sleeping" },
  { id: "standing", name: "站姿", slug: "standing" },
  { id: "jumping", name: "跳跃", slug: "jumping" },
  { id: "rolling", name: "打滚", slug: "rolling" },
  { id: "stretching", name: "伸懒腰", slug: "stretching" },
  { id: "cute", name: "卖萌", slug: "cute" },
  { id: "other", name: "其他", slug: "other" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const COLLECTION_TABS: { id: "all" | CategoryId; name: string }[] = [
  { id: "all", name: "全部" },
  { id: "sitting", name: "坐姿" },
  { id: "lying", name: "趴着" },
  { id: "jumping", name: "跳跃" },
  { id: "other", name: "其他" },
];

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
  categoryId: CategoryId;
  width: number;
  height: number;
  status: StickerStatus;
  original: Blob;
  cutout: Blob;
  sticker: Blob;
  createdAt: number;
  updatedAt: number;
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
  categoryId: CategoryId;
  status: DraftStatus;
  progress: string;
  error: string | null;
};
