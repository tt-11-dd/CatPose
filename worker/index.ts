/**
 * Cloudflare Worker API skeleton.
 * The website currently processes stickers in the browser so it runs
 * without D1/R2/AI credentials. Wire these routes when deploying.
 */

type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
  AI: Ai;
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function ok(data: unknown): Response {
  return json({ success: true, data, error: null });
}

function fail(code: string, message: string, status = 400): Response {
  return json({ success: false, data: null, error: { code, message } }, status);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/v1")) {
      return fail("NOT_FOUND", "not found", 404);
    }

    const path = url.pathname.replace(/^\/api\/v1/, "") || "/";

    if (path === "/health") {
      return ok({
        ok: true,
        pipeline: "cloudflare",
        hasDb: Boolean(env.DB),
        hasBucket: Boolean(env.BUCKET),
        hasAi: Boolean(env.AI),
      });
    }

    return fail(
      "NOT_IMPLEMENTED",
      "云端 API 还没接上。网站先用浏览器抠图和本地收藏。",
      501,
    );
  },
};
