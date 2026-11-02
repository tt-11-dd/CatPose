const MAX_BYTES = 15 * 1024 * 1024;
const MAX_EDGE = 6000;
const PROCESS_EDGE = 1280;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateImage(file: Blob): string | null {
  if (file.size > MAX_BYTES) return "IMAGE_TOO_LARGE";
  if (file.type && !TYPES.has(file.type) && file.type !== "") return "INVALID_IMAGE";
  return null;
}

export async function readDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const bmp = await createImageBitmap(blob);
  const size = { width: bmp.width, height: bmp.height };
  bmp.close();
  return size;
}

export async function resizeForProcess(blob: Blob, maxEdge = PROCESS_EDGE): Promise<Blob> {
  const bmp = await createImageBitmap(blob);
  const longEdge = Math.max(bmp.width, bmp.height);
  if (longEdge > MAX_EDGE) {
    bmp.close();
    throw new Error("IMAGE_TOO_LARGE");
  }
  if (longEdge <= maxEdge) {
    bmp.close();
    return blob;
  }
  const scale = maxEdge / longEdge;
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!out) throw new Error("IMAGE_PROCESS_FAILED");
  return out;
}
