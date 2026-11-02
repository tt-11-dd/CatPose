import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dilateAlpha,
  keepLargestSubject,
  strokeCoverage,
  strokeForSize,
  trimToContent,
  type PxBuf,
} from "../../src/lib/sticker.ts";

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

  it("feathers the outline instead of a hard pixel step", () => {
    assert.equal(strokeCoverage(0, 10, 2), 1);
    assert.equal(strokeCoverage(20, 10, 2), 0);
    const mid = strokeCoverage(10, 10, 2);
    assert.ok(mid > 0.45 && mid < 0.55);
  });

  it("keeps the bigger blob and drops a stray corner", () => {
    const alphas = [
      255, 255, 255, 0, 0, 255,
      255, 255, 255, 0, 0, 0,
      255, 255, 255, 0, 0, 0,
      0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0,
    ];
    const out = keepLargestSubject(px(6, 6, alphas));
    assert.equal(out.data[5 * 4 + 3], 0);
    assert.ok(out.data[0 * 4 + 3] > 0);
    assert.ok(out.data[7 * 4 + 3] > 0);
  });
});
