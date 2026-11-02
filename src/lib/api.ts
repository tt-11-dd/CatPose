import type { CatSlug, Sticker, User } from "../types";

type Ok<T> = { success: true; data: T; error: null };
type Err = { success: false; data: null; error: { code: string; message: string } };

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json()) as Ok<T> | Err;
  if (!body.success) {
    const err = new Error(body.error.message) as Error & { status: number; code: string };
    err.status = res.status;
    err.code = body.error.code;
    throw err;
  }
  return body.data;
}

export function apiAvailable(): Promise<boolean> {
  return fetch("/api/v1/health", { credentials: "include" })
    .then((r) => r.ok)
    .catch(() => false);
}

export const api = {
  me: () => req<User & { cats: { id: string; name: string; slug: string }[] }>("/users/me"),
  register: (email: string, password: string, nickname?: string) =>
    req<User>("/auth/register", { method: "POST", body: JSON.stringify({ email, password, nickname }) }),
  login: (email: string, password: string) =>
    req<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => req("/auth/logout", { method: "POST", body: "{}" }),
  patchMe: (nickname: string) =>
    req<User>("/users/me", { method: "PATCH", body: JSON.stringify({ nickname }) }),
  listStickers: () =>
    req<
      {
        id: string;
        title: string;
        width: number;
        height: number;
        status: string;
        created_at: number;
        updated_at: number;
        cat_slug: CatSlug;
      }[]
    >("/stickers"),
  uploadSticker: async (input: {
    catSlug: CatSlug;
    title: string;
    width: number;
    height: number;
    original: Blob;
    cutout: Blob;
    sticker: Blob;
  }): Promise<{ id: string }> => {
    const form = new FormData();
    form.set("catSlug", input.catSlug);
    form.set("title", input.title);
    form.set("width", String(input.width));
    form.set("height", String(input.height));
    form.set("original", input.original, "original.jpg");
    form.set("cutout", input.cutout, "cutout.png");
    form.set("sticker", input.sticker, "sticker.png");
    return req("/stickers", { method: "POST", body: form });
  },
  patchSticker: (id: string, patch: { title?: string; catSlug?: CatSlug }) =>
    req(`/stickers/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteSticker: (id: string) => req(`/stickers/${id}`, { method: "DELETE" }),
};

export async function fetchStickerBlobs(id: string): Promise<Pick<Sticker, "original" | "cutout" | "sticker">> {
  const kinds = ["original", "cutout", "sticker"] as const;
  const blobs = await Promise.all(
    kinds.map((k) => fetch(`/api/v1/stickers/${id}/file/${k}`, { credentials: "include" }).then((r) => r.blob())),
  );
  return { original: blobs[0], cutout: blobs[1], sticker: blobs[2] };
}
