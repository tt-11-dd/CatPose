import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dilateAlpha, strokeForSize, trimToContent, type PxBuf } from "../../src/lib/sticker.ts";

function px(width: number, height: number, alphas: number[]): PxBuf {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 3] = alphas[i] ?? 0;
  }
  return { data, width, height };
}

describe("sticker mask", () => {
  it("scales stroke with image size", () => {
    assert.equal(strokeForSize(512), 12);
    assert.ok(strokeForSize(256) < strokeForSize(1024));
  });

  it("trims transparent padding", () => {
    const src = px(5, 5, [
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 255, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
    ]);
    const trimmed = trimToContent(src);
    assert.equal(trimmed.width, 1);
    assert.equal(trimmed.height, 1);
    assert.equal(trimmed.data[3], 255);
  });

  it("dilates a center pixel into neighbors", () => {
    const src = px(3, 3, [0, 0, 0, 0, 255, 0, 0, 0, 0]);
    const out = dilateAlpha(src, 1);
    assert.equal(out.length, 9);
    assert.ok(out.every((a) => a === 255));
  });
});
