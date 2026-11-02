import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stackStickers, type StackInput } from "../../src/lib/stack.ts";

function item(id: string, createdAt: number, width = 400, height = 400): StackInput {
  return { id, width, height, createdAt };
}

function overlap(a: { x: number; bottom: number; w: number; h: number }, b: typeof a): boolean {
  const ax = a.x + a.w / 2;
  const ay = a.bottom + a.h / 2;
  const bx = b.x + b.w / 2;
  const by = b.bottom + b.h / 2;
  const dx = (ax - bx) / (a.w * 0.42 + b.w * 0.42);
  const dy = (ay - by) / (a.h * 0.42 + b.h * 0.42);
  return dx * dx + dy * dy < 0.98;
}

describe("stackStickers", () => {
  it("puts a single sticker on the floor", () => {
    const [one] = stackStickers([item("a", 1)], 360);
    assert.ok(one);
    assert.ok(one.bottom < 4, `expected on the floor, got bottom=${one.bottom}`);
    assert.ok(one.x >= 0 && one.x + one.w <= 360);
  });

  it("does not overlap ellipses when many drop in", () => {
    const items = Array.from({ length: 12 }, (_, i) => item(`s${i}`, i + 1, 300 + (i % 5) * 40, 380));
    const piled = stackStickers(items, 390);
    assert.equal(piled.length, 12);
    for (let i = 0; i < piled.length; i++) {
      for (let j = i + 1; j < piled.length; j++) {
        assert.equal(overlap(piled[i], piled[j]), false, `${piled[i].id} overlaps ${piled[j].id}`);
      }
    }
  });

  it("stacks a second sticker higher when the floor only fits one", () => {
    const piled = stackStickers([item("base", 1), item("top", 2)], 56);
    const base = piled.find((p) => p.id === "base")!;
    const top = piled.find((p) => p.id === "top")!;
    assert.ok(top.bottom > base.bottom + 8, `top ${top.bottom} should sit above base ${base.bottom}`);
  });
});
