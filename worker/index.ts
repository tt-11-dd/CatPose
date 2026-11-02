type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
  AUTH_SECRET: string;
};

type User = { id: string; email: string; nickname: string };

const COOKIE = "catpose_session";
const DAY = 60 * 60 * 24 * 1000;
const CATS = [
  { slug: "yidian", name: "一点" },
  { slug: "shiyi", name: "十一" },
] as const;

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(data, { status, headers });
}
function ok(data: unknown, headers?: HeadersInit): Response {
  return json({ success: true, data, error: null }, 200, headers);
}
function fail(code: string, message: string, status = 400): Response {
  return json({ success: false, data: null, error: { code, message } }, status);
}

function hex(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return hex(buf);
}

async function hashPassword(password: string, saltHex?: string): Promise<string> {
  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{2}/g)!.map((x) => parseInt(x, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256,
  );
  return `${hex(salt)}:${hex(bits)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt] = stored.split(":");
  if (!salt) return false;
  return (await hashPassword(password, salt)) === stored;
}

function cookie(token: string, maxAgeSec: number, secure: boolean): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure ? "; Secure" : ""}`;
}

function readCookie(req: Request): string | null {
  const raw = req.headers.get("Cookie") ?? "";
  const m = raw.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  return m?.[1] ?? null;
}

async function userFromReq(req: Request, env: Env): Promise<User | null> {
  const token = readCookie(req);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.nickname FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?`,
  )
    .bind(await sha256(token), Date.now())
    .first<User>();
  return row ?? null;
}

async function createSession(env: Env, userId: string, secure: boolean): Promise<string> {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const id = await sha256(token);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`,
  )
    .bind(id, userId, now + 30 * DAY, now)
    .run();
  return cookie(token, (30 * DAY) / 1000, secure);
}

function uid(): string {
  return crypto.randomUUID();
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/v1")) {
      return fail("NOT_FOUND", "not found", 404);
    }
    if (!env.AUTH_SECRET) {
      return fail("DATABASE_ERROR", "缺少 AUTH_SECRET", 500);
    }

    const path = url.pathname.replace(/^\/api\/v1/, "") || "/";
    const secure = url.protocol === "https:";

    try {
      if (req.method === "POST" && path === "/auth/register") {
        const body = (await req.json()) as { email?: string; password?: string; nickname?: string };
        const email = body.email?.trim().toLowerCase() ?? "";
        const password = body.password ?? "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("INVALID_IMAGE", "邮箱格式不对");
        if (password.length < 6) return fail("INVALID_IMAGE", "密码至少 6 位");
        const exists = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first();
        if (exists) return fail("PERMISSION_DENIED", "这个邮箱已经注册过了");
        const id = uid();
        const now = Date.now();
        const nickname = body.nickname?.trim() || email.split("@")[0];
        await env.DB.prepare(
          `INSERT INTO users (id, email, password_hash, nickname, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
          .bind(id, email, await hashPassword(password), nickname, now, now)
          .run();
        for (const cat of CATS) {
          await env.DB.prepare(
            `INSERT INTO cats (id, user_id, name, slug, created_at) VALUES (?, ?, ?, ?, ?)`,
          )
            .bind(uid(), id, cat.name, cat.slug, now)
            .run();
        }
        const set = await createSession(env, id, secure);
        return ok({ id, email, nickname }, { "Set-Cookie": set });
      }

      if (req.method === "POST" && path === "/auth/login") {
        const body = (await req.json()) as { email?: string; password?: string };
        const email = body.email?.trim().toLowerCase() ?? "";
        const row = await env.DB.prepare(
          `SELECT id, email, nickname, password_hash FROM users WHERE email = ?`,
        )
          .bind(email)
          .first<{ id: string; email: string; nickname: string; password_hash: string }>();
        if (!row || !(await verifyPassword(body.password ?? "", row.password_hash))) {
          return fail("PERMISSION_DENIED", "邮箱或密码不对", 401);
        }
        const set = await createSession(env, row.id, secure);
        return ok({ id: row.id, email: row.email, nickname: row.nickname }, { "Set-Cookie": set });
      }

      if (req.method === "POST" && path === "/auth/logout") {
        const token = readCookie(req);
        if (token) {
          await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(await sha256(token)).run();
        }
        return ok({ ok: true }, { "Set-Cookie": cookie("", 0, secure) });
      }

      const user = await userFromReq(req, env);

      if (req.method === "GET" && path === "/users/me") {
        if (!user) return fail("PERMISSION_DENIED", "请先登录", 401);
        const cats = await env.DB.prepare(`SELECT id, name, slug FROM cats WHERE user_id = ?`)
          .bind(user.id)
          .all();
        return ok({ ...user, cats: cats.results });
      }

      if (req.method === "PATCH" && path === "/users/me") {
        if (!user) return fail("PERMISSION_DENIED", "请先登录", 401);
        const body = (await req.json()) as { nickname?: string };
        const nickname = body.nickname?.trim() || user.nickname;
        await env.DB.prepare(`UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?`)
          .bind(nickname, Date.now(), user.id)
          .run();
        return ok({ ...user, nickname });
      }

      if (req.method === "GET" && path === "/cats") {
        if (!user) return fail("PERMISSION_DENIED", "请先登录", 401);
        const cats = await env.DB.prepare(`SELECT id, name, slug FROM cats WHERE user_id = ?`)
          .bind(user.id)
          .all();
        return ok(cats.results);
      }

      if (req.method === "GET" && path === "/stickers") {
        if (!user) return fail("PERMISSION_DENIED", "请先登录", 401);
        const rows = await env.DB.prepare(
          `SELECT s.id, s.title, s.width, s.height, s.status, s.created_at, s.updated_at, c.slug as cat_slug
           FROM stickers s JOIN cats c ON c.id = s.cat_id
           WHERE s.user_id = ? ORDER BY s.created_at DESC`,
        )
          .bind(user.id)
          .all();
        return ok(rows.results);
      }

      const fileMatch = path.match(/^\/stickers\/([^/]+)\/file\/(original|cutout|sticker)$/);
      if (req.method === "GET" && fileMatch) {
        if (!user) return fail("PERMISSION_DENIED", "请先登录", 401);
        const [, stickerId, kind] = fileMatch;
        const col = `${kind}_key`;
        const row = await env.DB.prepare(
          `SELECT ${col} as object_key FROM stickers WHERE id = ? AND user_id = ?`,
        )
          .bind(stickerId, user.id)
          .first<{ object_key: string | null }>();
        if (!row?.object_key) return fail("STICKER_NOT_FOUND", "贴纸不存在", 404);
        const obj = await env.BUCKET.get(row.object_key);
        if (!obj) return fail("STICKER_NOT_FOUND", "图片不在了", 404);
        return new Response(obj.body, {
          headers: {
            "Content-Type": obj.httpMetadata?.contentType || "image/png",
            "Cache-Control": "private, max-age=3600",
          },
        });
      }

      const idMatch = path.match(/^\/stickers\/([^/]+)$/);
      if (idMatch && user) {
        const stickerId = idMatch[1];
        if (req.method === "DELETE") {
          const row = await env.DB.prepare(
            `SELECT original_key, cutout_key, sticker_key FROM stickers WHERE id = ? AND user_id = ?`,
          )
            .bind(stickerId, user.id)
            .first<{ original_key: string | null; cutout_key: string | null; sticker_key: string | null }>();
          if (!row) return fail("STICKER_NOT_FOUND", "贴纸不存在", 404);
          for (const key of [row.original_key, row.cutout_key, row.sticker_key]) {
            if (key) await env.BUCKET.delete(key);
          }
          await env.DB.prepare(`DELETE FROM stickers WHERE id = ? AND user_id = ?`)
            .bind(stickerId, user.id)
            .run();
          return ok({ ok: true });
        }
        if (req.method === "PATCH") {
          const body = (await req.json()) as { title?: string; catSlug?: string };
          const current = await env.DB.prepare(
            `SELECT id FROM stickers WHERE id = ? AND user_id = ?`,
          )
            .bind(stickerId, user.id)
            .first();
          if (!current) return fail("STICKER_NOT_FOUND", "贴纸不存在", 404);
          let catId: string | undefined;
          if (body.catSlug) {
            const cat = await env.DB.prepare(
              `SELECT id FROM cats WHERE user_id = ? AND slug = ?`,
            )
              .bind(user.id, body.catSlug)
              .first<{ id: string }>();
            if (!cat) return fail("STICKER_NOT_FOUND", "找不到这只猫咪");
            catId = cat.id;
          }
          await env.DB.prepare(
            `UPDATE stickers SET title = COALESCE(?, title), cat_id = COALESCE(?, cat_id), updated_at = ? WHERE id = ?`,
          )
            .bind(body.title?.trim() || null, catId ?? null, Date.now(), stickerId)
            .run();
          return ok({ id: stickerId });
        }
      }

      if (req.method === "POST" && path === "/stickers") {
        if (!user) return fail("PERMISSION_DENIED", "请先登录", 401);
        const form = await req.formData();
        const catSlug = String(form.get("catSlug") || "yidian");
        const title = String(form.get("title") || "猫咪姿势");
        const width = Number(form.get("width") || 0);
        const height = Number(form.get("height") || 0);
        const original = form.get("original");
        const cutout = form.get("cutout");
        const stickerFile = form.get("sticker");
        if (!(stickerFile instanceof File)) return fail("INVALID_IMAGE", "缺少贴纸图片");
        const cat = await env.DB.prepare(`SELECT id FROM cats WHERE user_id = ? AND slug = ?`)
          .bind(user.id, catSlug)
          .first<{ id: string }>();
        if (!cat) return fail("STICKER_NOT_FOUND", "找不到这只猫咪");
        const id = uid();
        const now = Date.now();
        const base = `stickers/${user.id}/${id}`;
        const putFile = async (file: FormDataEntryValue | null, name: string) => {
          if (!(file instanceof File)) return null;
          const key = `${base}/${name}`;
          await env.BUCKET.put(key, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type || "image/png" },
          });
          return key;
        };
        const originalKey = await putFile(original, "original");
        const cutoutKey = await putFile(cutout, "cutout.png");
        const stickerKey = await putFile(stickerFile, "sticker.png");
        await env.DB.prepare(
          `INSERT INTO stickers
            (id, user_id, cat_id, title, original_key, cutout_key, sticker_key, width, height, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
        )
          .bind(id, user.id, cat.id, title, originalKey, cutoutKey, stickerKey, width, height, now, now)
          .run();
        return ok({ id, catSlug, title, width, height, createdAt: now });
      }

      if (path === "/health") {
        return ok({ ok: true, hasDb: Boolean(env.DB), hasBucket: Boolean(env.BUCKET) });
      }

      return fail("NOT_FOUND", "接口不存在", 404);
    } catch (err) {
      console.error(err);
      return fail("DATABASE_ERROR", "服务器出了点问题", 500);
    }
  },
};
