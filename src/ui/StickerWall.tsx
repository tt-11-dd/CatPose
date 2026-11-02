import { useEffect, useMemo, useState } from "react";
import type { Sticker } from "../types";
import { PawPrint } from "./PawPrint";

const PAWS = [
  { x: 46, y: 22, r: 20, s: 22 },
  { x: 18, y: 58, r: -30, s: 18 },
  { x: 72, y: 78, r: 40, s: 20 },
  { x: 8, y: 18, r: -10, s: 16 },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function scatter(id: string, i: number) {
  const h = hash(id + String(i));
  const col = i % 3;
  const row = Math.floor(i / 3);
  const jx = (h % 19) - 9;
  const jy = ((h >> 6) % 17) - 8;
  const rot = ((h % 31) - 15) * 1.2;
  const w = 26 + ((h >> 11) % 16);
  return {
    left: Math.max(0, 3 + col * 31 + jx * 0.55),
    top: Math.max(0, 2 + row * 24 + jy * 0.5),
    rot,
    w,
    z: (h % 12) + (i % 3),
  };
}

function useBlobUrl(blob: Blob) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

export function StickerImg({
  blob,
  alt,
  className,
}: {
  blob: Blob;
  alt: string;
  className?: string;
}) {
  const url = useBlobUrl(blob);
  if (!url) return null;
  return <img src={url} alt={alt} className={className} draggable={false} />;
}

export function StickerWall({
  stickers,
  onOpen,
}: {
  stickers: Sticker[];
  onOpen: (id: string) => void;
}) {
  const layout = useMemo(
    () => stickers.map((s, i) => ({ s, ...scatter(s.id, i) })),
    [stickers],
  );
  const rows = Math.max(1, Math.ceil(stickers.length / 3));
  const minH = Math.max(280, rows * 168 + 48);

  if (stickers.length === 0) {
    return (
      <div className="relative mx-2 h-full min-h-[280px]">
        {PAWS.map((p, i) => (
          <PawPrint
            key={i}
            size={p.s}
            className="pointer-events-none absolute text-paw"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.r}deg)` }}
          />
        ))}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <PawPrint size={40} className="mb-3 text-honey/80" />
          <p className="font-display text-lg font-semibold text-ink">还没有贴纸</p>
          <p className="mt-1 text-sm text-muted">拍一点或十一，收成第一张吧</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-1 overflow-hidden" style={{ minHeight: minH }}>
      {PAWS.map((p, i) => (
        <PawPrint
          key={i}
          size={p.s}
          className="pointer-events-none absolute text-paw"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.r}deg)` }}
        />
      ))}
      {layout.map(({ s, left, top, rot, w, z }) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onOpen(s.id)}
          className="absolute origin-center"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${w}%`,
            transform: `rotate(${rot}deg)`,
            zIndex: z,
          }}
        >
          <StickerImg blob={s.sticker} alt={s.title} className="w-full select-none object-contain" />
        </button>
      ))}
    </div>
  );
}

export function StickerGrid({
  stickers,
  onOpen,
}: {
  stickers: Sticker[];
  onOpen: (id: string) => void;
}) {
  if (stickers.length === 0) {
    return <p className="py-16 text-center text-sm text-muted">这只猫咪还没有贴纸</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {stickers.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onOpen(s.id)}
          className="aspect-square p-0.5"
          style={{ transform: `rotate(${[-7, 5, -3, 8, -5, 4][i % 6]}deg)` }}
        >
          <StickerImg blob={s.sticker} alt={s.title} className="h-full w-full object-contain" />
        </button>
      ))}
    </div>
  );
}
