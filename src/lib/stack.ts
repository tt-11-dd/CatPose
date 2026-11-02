/** Drop stickers onto a floor so they pile up without overlapping. */

export type StackInput = {
  id: string;
  width: number;
  height: number;
  createdAt: number;
};

export type Stacked = {
  id: string;
  x: number;
  bottom: number;
  w: number;
  h: number;
  rot: number;
  z: number;
};

type Body = { cx: number; cy: number; rx: number; ry: number };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function hits(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  floorY: number,
  bodies: Body[],
  x0: number,
  x1: number,
): boolean {
  if (cx < x0 || cx > x1 || cy < floorY) return true;
  for (const b of bodies) {
    const dx = (cx - b.cx) / (rx + b.rx);
    const dy = (cy - b.cy) / (ry + b.ry);
    if (dx * dx + dy * dy < 1) return true;
  }
  return false;
}

function dropY(
  cx: number,
  rx: number,
  ry: number,
  floorY: number,
  bodies: Body[],
  x0: number,
  x1: number,
  hi: number,
): number {
  if (!hits(cx, floorY, rx, ry, floorY, bodies, x0, x1)) return floorY;
  let lo = floorY;
  let top = hi;
  while (top - lo > 0.5) {
    const mid = (lo + top) / 2;
    if (hits(cx, mid, rx, ry, floorY, bodies, x0, x1)) lo = mid;
    else top = mid;
  }
  return top;
}

export function stackStickers(items: StackInput[], wallW: number): Stacked[] {
  if (wallW < 32 || items.length === 0) return [];

  const pad = 6;
  const ordered = [...items].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const bodies: Body[] = [];
  const out: Stacked[] = [];

  for (const item of ordered) {
    const h0 = hash(item.id);
    const aspect = Math.max(0.35, Math.min(2.8, (item.width || 1) / (item.height || 1)));
    let w = 92 + (h0 % 36);
    w = Math.min(w, wallW * 0.44);
    let h = w / aspect;
    if (h > 168) {
      w *= 168 / h;
      h = 168;
    }

    // ponytail: ellipse ≈ Minkowski sum; SAT/OBB if stickers start wedging into each other
    const rx = w * 0.42;
    const ry = h * 0.42;
    const floorY = h / 2;
    const x0 = pad + w / 2;
    const x1 = Math.max(x0, wallW - pad - w / 2);
    const span = x1 - x0;
    const seedX = x0 + (((h0 >>> 8) % 1000) / 1000) * span;
    const ceiling = (bodies.length + 1) * (h + 8) + 80;
    const slides = [0, -28, 28, -56, 56, -84, 84, -120, 120, span * -0.35, span * 0.35];

    let bestX = seedX;
    let bestY = dropY(seedX, rx, ry, floorY, bodies, x0, x1, ceiling);
    for (const d of slides) {
      const cx = Math.min(x1, Math.max(x0, seedX + d));
      const cy = dropY(cx, rx, ry, floorY, bodies, x0, x1, ceiling);
      if (cy + 0.25 < bestY) {
        bestX = cx;
        bestY = cy;
      }
    }

    bodies.push({ cx: bestX, cy: bestY, rx, ry });
    const rot = ((h0 % 21) - 10) * 1.15;
    out.push({
      id: item.id,
      x: bestX - w / 2,
      bottom: bestY - h / 2,
      w,
      h,
      rot,
      z: out.length + 1,
    });
  }

  return out;
}
