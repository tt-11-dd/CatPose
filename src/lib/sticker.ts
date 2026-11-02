/** Pixel-buffer sticker outline. Pure so Node can test the mask math. */

export type PxBuf = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

export function strokeForSize(longEdge: number): number {
  return Math.max(8, Math.round(12 * (longEdge / 512)));
}

export function marginForSize(longEdge: number): number {
  return Math.max(16, Math.round(24 * (longEdge / 512)));
}

export function trimToContent(src: PxBuf, pad = 0): PxBuf {
  const { data, width, height } = src;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return src;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const srcOff = ((y + minY) * width + minX) * 4;
    out.set(data.subarray(srcOff, srcOff + w * 4), y * w * 4);
  }
  return { data: out, width: w, height: h };
}

function morphBinary(
  src: Uint8Array,
  width: number,
  height: number,
  radius: number,
  mode: "min" | "max",
): Uint8Array {
  const r = Math.max(1, radius);
  const pick = mode === "max" ? Math.max : Math.min;
  const seed = mode === "max" ? 0 : 1;
  const tmp = new Uint8Array(width * height);
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = seed;
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(width - 1, x + r);
      for (let i = x0; i <= x1; i++) v = pick(v, src[y * width + i]);
      tmp[y * width + x] = v;
    }
  }
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(height - 1, y + r);
    for (let x = 0; x < width; x++) {
      let v = seed;
      for (let j = y0; j <= y1; j++) v = pick(v, tmp[j * width + x]);
      out[y * width + x] = v;
    }
  }
  return out;
}

function largestBlob(bin: Uint8Array, width: number, height: number): Uint8Array {
  const n = width * height;
  const seen = new Uint8Array(n);
  const stack = new Int32Array(n);
  let bestCount = 0;
  let bestSeed = -1;
  for (let i = 0; i < n; i++) {
    if (!bin[i] || seen[i]) continue;
    let top = 0;
    let count = 0;
    stack[top++] = i;
    seen[i] = 1;
    while (top > 0) {
      const p = stack[--top];
      count++;
      const x = p % width;
      const y = (p - x) / width;
      const neigh = [p - 1, p + 1, p - width, p + width];
      const ok = [x > 0, x + 1 < width, y > 0, y + 1 < height];
      for (let k = 0; k < 4; k++) {
        const q = neigh[k];
        if (!ok[k] || !bin[q] || seen[q]) continue;
        seen[q] = 1;
        stack[top++] = q;
      }
    }
    if (count > bestCount) {
      bestCount = count;
      bestSeed = i;
    }
  }
  const out = new Uint8Array(n);
  if (bestSeed < 0) return out;
  topFill(out, bin, width, height, bestSeed);
  return out;
}

function topFill(
  out: Uint8Array,
  bin: Uint8Array,
  width: number,
  height: number,
  seed: number,
): void {
  const stack = new Int32Array(width * height);
  let top = 0;
  stack[top++] = seed;
  out[seed] = 1;
  while (top > 0) {
    const p = stack[--top];
    const x = p % width;
    const y = (p - x) / width;
    const neigh = [p - 1, p + 1, p - width, p + width];
    const ok = [x > 0, x + 1 < width, y > 0, y + 1 < height];
    for (let k = 0; k < 4; k++) {
      const q = neigh[k];
      if (!ok[k] || !bin[q] || out[q]) continue;
      out[q] = 1;
      stack[top++] = q;
    }
  }
}

/**
 * Drop leftover foreground (toys, sofa chunks) that are not the main subject.
 * ponytail: largest blob after a light erode. A cat fused to a cushion still sticks;
 * upgrade is click-to-segment (SAM) or a pet model.
 */
export function keepLargestSubject(src: PxBuf): PxBuf {
  const { data, width, height } = src;
  const n = width * height;
  const solid = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (data[i * 4 + 3] >= 48) solid[i] = 1;
  }
  const longEdge = Math.max(width, height);
  const erodeR = Math.max(1, Math.round(longEdge / 400));
  const opened = morphBinary(solid, width, height, erodeR, "min");
  const body = largestBlob(opened, width, height);
  if (!body.some(Boolean)) return src;
  const grow = erodeR + Math.max(2, Math.round(longEdge / 280));
  const halo = morphBinary(body, width, height, grow, "max");
  const out = new Uint8ClampedArray(data);
  for (let i = 0; i < n; i++) {
    if (halo[i] && data[i * 4 + 3] >= 8) continue;
    out[i * 4] = 0;
    out[i * 4 + 1] = 0;
    out[i * 4 + 2] = 0;
    out[i * 4 + 3] = 0;
  }
  return { data: out, width, height };
}

/** Separable max-filter on alpha. Radius in pixels. */
export function dilateAlpha(src: PxBuf, radius: number): Uint8Array {
  const { data, width, height } = src;
  const r = Math.max(1, radius);
  const tmp = new Uint8Array(width * height);
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let m = 0;
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(width - 1, x + r);
      for (let i = x0; i <= x1; i++) {
        const a = data[(y * width + i) * 4 + 3];
        if (a > m) m = a;
      }
      tmp[y * width + x] = m;
    }
  }
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(height - 1, y + r);
    for (let x = 0; x < width; x++) {
      let m = 0;
      for (let j = y0; j <= y1; j++) {
        const a = tmp[j * width + x];
        if (a > m) m = a;
      }
      out[y * width + x] = m;
    }
  }
  return out;
}

/** 3×3 chamfer distance to nearest solid pixel. Circular-ish, not boxy. */
export function chamferDistance(bin: Uint8Array, width: number, height: number): Float32Array {
  const inf = 1e6;
  const d = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) d[i] = bin[i] ? 0 : inf;
  const ortho = 1;
  const diag = Math.SQRT2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + ortho);
      if (y > 0) v = Math.min(v, d[i - width] + ortho);
      if (x > 0 && y > 0) v = Math.min(v, d[i - width - 1] + diag);
      if (x + 1 < width && y > 0) v = Math.min(v, d[i - width + 1] + diag);
      d[i] = v;
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      let v = d[i];
      if (x + 1 < width) v = Math.min(v, d[i + 1] + ortho);
      if (y + 1 < height) v = Math.min(v, d[i + width] + ortho);
      if (x + 1 < width && y + 1 < height) v = Math.min(v, d[i + width + 1] + diag);
      if (x > 0 && y + 1 < height) v = Math.min(v, d[i + width - 1] + diag);
      d[i] = v;
    }
  }
  return d;
}

export function strokeCoverage(dist: number, stroke: number, feather: number): number {
  const inner = stroke - feather;
  const outer = stroke + feather;
  if (dist <= inner) return 1;
  if (dist >= outer) return 0;
  const t = (dist - inner) / (2 * feather);
  return 1 - t * t * (3 - 2 * t);
}

function boxBlurAlpha(src: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const r = Math.max(1, radius);
  const tmp = new Uint16Array(width * height);
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    let acc = 0;
    for (let x = 0; x < width; x++) {
      acc += src[y * width + x];
      if (x > r) acc -= src[y * width + (x - r - 1)];
      const left = Math.max(0, x - r);
      const count = x - left + 1;
      tmp[y * width + x] = Math.round(acc / count);
    }
  }
  for (let x = 0; x < width; x++) {
    let acc = 0;
    for (let y = 0; y < height; y++) {
      acc += tmp[y * width + x];
      if (y > r) acc -= tmp[(y - r - 1) * width + x];
      const top = Math.max(0, y - r);
      const count = y - top + 1;
      out[y * width + x] = Math.round(acc / count);
    }
  }
  return out;
}

export function composeSticker(cutout: PxBuf): PxBuf {
  const trimmed = trimToContent(cutout, 1);
  const longEdge = Math.max(trimmed.width, trimmed.height);
  const stroke = strokeForSize(longEdge);
  const margin = marginForSize(longEdge);
  const feather = Math.max(2, stroke * 0.18);
  const shadowBlur = Math.max(4, Math.round(8 * (longEdge / 512)));
  const shadowY = Math.max(2, Math.round(4 * (longEdge / 512)));
  const pad = Math.ceil(margin + stroke + feather);
  const width = trimmed.width + pad * 2;
  const height = trimmed.height + pad * 2 + shadowY + shadowBlur;

  const rawA = new Uint8Array(trimmed.width * trimmed.height);
  for (let i = 0; i < rawA.length; i++) rawA[i] = trimmed.data[i * 4 + 3];
  const softA = boxBlurAlpha(rawA, trimmed.width, trimmed.height, 1);

  const bin = new Uint8Array(width * height);
  for (let y = 0; y < trimmed.height; y++) {
    for (let x = 0; x < trimmed.width; x++) {
      if (softA[y * trimmed.width + x] > 40) {
        bin[(y + pad) * width + (x + pad)] = 1;
      }
    }
  }
  const dist = chamferDistance(bin, width, height);
  const white = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    white[i] = Math.round(strokeCoverage(dist[i], stroke, feather) * 255);
  }
  const shadow = boxBlurAlpha(white, width, height, shadowBlur);
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const sy = Math.floor(i / width) - shadowY;
    const sx = i % width;
    const si = sy >= 0 && sy < height ? sy * width + sx : -1;
    const sh = si >= 0 ? shadow[si] : 0;
    const o = i * 4;
    if (sh > 0) {
      data[o + 3] = Math.min(255, Math.round(sh * 0.16));
    }
    const w = white[i];
    if (w > 0) {
      data[o] = 255;
      data[o + 1] = 255;
      data[o + 2] = 255;
      data[o + 3] = w;
    }
  }

  for (let y = 0; y < trimmed.height; y++) {
    for (let x = 0; x < trimmed.width; x++) {
      const so = (y * trimmed.width + x) * 4;
      const a = trimmed.data[so + 3];
      if (a <= 8) continue;
      const o = ((y + pad) * width + (x + pad)) * 4;
      const srcA = a / 255;
      const dstA = data[o + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      if (outA <= 0) continue;
      data[o] = Math.round((trimmed.data[so] * srcA + data[o] * dstA * (1 - srcA)) / outA);
      data[o + 1] = Math.round(
        (trimmed.data[so + 1] * srcA + data[o + 1] * dstA * (1 - srcA)) / outA,
      );
      data[o + 2] = Math.round(
        (trimmed.data[so + 2] * srcA + data[o + 2] * dstA * (1 - srcA)) / outA,
      );
      data[o + 3] = Math.round(outA * 255);
    }
  }

  return { data, width, height };
}

export async function blobToPx(blob: Blob): Promise<PxBuf> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: img.data, width: img.width, height: img.height };
}

export async function pxToPng(px: PxBuf): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = px.width;
  canvas.height = px.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const img = ctx.createImageData(px.width, px.height);
  img.data.set(px.data);
  ctx.putImageData(img, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("png");
  return blob;
}

export async function isolateSubject(cutout: Blob): Promise<Blob> {
  return pxToPng(keepLargestSubject(await blobToPx(cutout)));
}

export async function generateSticker(cutout: Blob): Promise<{ blob: Blob; width: number; height: number }> {
  const px = composeSticker(keepLargestSubject(await blobToPx(cutout)));
  return { blob: await pxToPng(px), width: px.width, height: px.height };
}
