import type { Profile, Sticker } from "../types";

const DB_NAME = "catpose";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("stickers")) {
        db.createObjectStore("stickers", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function listStickers(): Promise<Sticker[]> {
  const db = await openDb();
  const rows = await req(db.transaction("stickers").objectStore("stickers").getAll());
  db.close();
  return (rows as Sticker[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSticker(id: string): Promise<Sticker | undefined> {
  const db = await openDb();
  const row = await req(db.transaction("stickers").objectStore("stickers").get(id));
  db.close();
  return row as Sticker | undefined;
}

export async function putSticker(sticker: Sticker): Promise<void> {
  const db = await openDb();
  await req(db.transaction("stickers", "readwrite").objectStore("stickers").put(sticker));
  db.close();
}

export async function deleteSticker(id: string): Promise<void> {
  const db = await openDb();
  await req(db.transaction("stickers", "readwrite").objectStore("stickers").delete(id));
  db.close();
}

export async function clearStickers(): Promise<void> {
  const db = await openDb();
  await req(db.transaction("stickers", "readwrite").objectStore("stickers").clear());
  db.close();
}

export async function getProfile(): Promise<Profile> {
  const db = await openDb();
  const row = (await req(
    db.transaction("meta").objectStore("meta").get("profile"),
  )) as { key: string; value: Profile } | undefined;
  db.close();
  return row?.value ?? { nickname: "猫奴" };
}

export async function setProfile(profile: Profile): Promise<void> {
  const db = await openDb();
  await req(
    db.transaction("meta", "readwrite").objectStore("meta").put({ key: "profile", value: profile }),
  );
  db.close();
}
