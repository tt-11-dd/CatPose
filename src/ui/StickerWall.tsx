import { useEffect, useMemo, useState } from "react";
import type { Sticker } from "../types";
import { PawPrint } from "./PawPrint";

const SLOTS = [
  { x: 4, y: 4, r: -8, w: 40 },
  { x: 38, y: 0, r: 14, w: 34, deco: "zzz" as const },
  { x: 62, y: 10, r: -6, w: 36, deco: "spark" as const },
  { x: 2, y: 38, r: 10, w: 38, deco: "heart" as const },
  { x: 36, y: 36, r: -5, w: 36 },
  { x: 66, y: 42, r: 12, w: 32 },
  { x: 0, y: 68, r: -7, w: 38 },
  { x: 34, y: 70, r: 6, w: 40 },
  { x: 66, y: 66, r: -11, w: 34, deco: "spark" as const },
];

const PAWS = [
  { x: 46, y: 22, r: 20, s: 22 },
  { x: 18, y: 58, r: -30, s: 18 },
  { x: 72, y: 78, r: 40, s: 20 },
  { x: 8, y: 18, r: -10, s: 16 },
];

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

function Deco({ kind }: { kind?: "zzz" | "spark" | "heart" }) {
  if (kind === "zzz") {
    return (
      <span className="font-hand absolute -top-3 right-1 text-lg leading-none text-mint">
        zzz
      </span>
    );
  }
  if (kind === "spark") {
    return (
      <span className="absolute -top-2 -right-1 text-honey-dark">✦</span>
    );
  }
  if (kind === "heart") {
    return <span className="absolute top-2 right-2 text-base text-[#E58AA0]">♡</span>;
  }
  return null;
}

export function StickerWall({
  stickers,
  onOpen,
}: {
  stickers: Sticker[];
  onOpen: (id: string) => void;
}) {
  const shown = useMemo(() => stickers.slice(0, 9), [stickers]);

  if (shown.length === 0) {
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
          <p className="mt-1 text-sm text-muted">拍一只猫咪，收成第一张姿势吧</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-1 min-h-[420px]">
      {PAWS.map((p, i) => (
        <PawPrint
          key={i}
          size={p.s}
          className="pointer-events-none absolute text-paw"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.r}deg)` }}
        />
      ))}
      {shown.map((sticker, i) => {
        const slot = SLOTS[i] ?? SLOTS[i % SLOTS.length];
        return (
          <button
            key={sticker.id}
            type="button"
            onClick={() => onOpen(sticker.id)}
            className="absolute origin-center"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.w}%`,
              transform: `rotate(${slot.r}deg)`,
            }}
          >
            <Deco kind={"deco" in slot ? slot.deco : undefined} />
            <StickerImg
              blob={sticker.sticker}
              alt={sticker.title}
              className="w-full select-none object-contain"
            />
          </button>
        );
      })}
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
    return (
      <p className="px-2 py-16 text-center text-sm text-muted">这个分类还是空的</p>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-3">
      {stickers.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onOpen(s.id)}
          className="aspect-square rounded-2xl bg-white/60 p-1"
          style={{ transform: `rotate(${[-4, 3, -2, 5, -3, 2][i % 6]}deg)` }}
        >
          <StickerImg blob={s.sticker} alt={s.title} className="h-full w-full object-contain" />
        </button>
      ))}
    </div>
  );
}
