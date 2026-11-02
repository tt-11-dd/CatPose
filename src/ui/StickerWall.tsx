import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { stackStickers } from "../lib/stack";
import type { Sticker } from "../types";
import { PawPrint } from "./PawPrint";

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

export function StickerWall({
  stickers,
  onOpen,
}: {
  stickers: Sticker[];
  onOpen: (id: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [wallW, setWallW] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const sync = () => setWallW(el.clientWidth);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(
    () =>
      stackStickers(
        stickers.map((s) => ({
          id: s.id,
          width: s.width,
          height: s.height,
          createdAt: s.createdAt,
        })),
        wallW,
      ),
    [stickers, wallW],
  );
  const byId = useMemo(() => new Map(stickers.map((s) => [s.id, s])), [stickers]);
  const pileH = layout.reduce((m, p) => Math.max(m, p.bottom + p.h + 12), 280);

  return (
    <div ref={boxRef} className="relative mx-1 h-full min-h-[280px]" style={{ minHeight: stickers.length ? pileH : undefined }}>
      {PAWS.map((p, i) => (
        <PawPrint
          key={i}
          size={p.s}
          className="pointer-events-none absolute text-paw"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.r}deg)` }}
        />
      ))}
      {stickers.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <PawPrint size={40} className="mb-3 text-honey/80" />
          <p className="font-display text-lg font-semibold text-ink">还没有贴纸</p>
          <p className="mt-1 text-sm text-muted">拍一点或十一，收成第一张吧</p>
        </div>
      ) : (
        layout.map((p, i) => {
          const s = byId.get(p.id);
          if (!s) return null;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onOpen(s.id)}
              className="sticker-drop absolute origin-center"
              style={
                {
                  left: p.x,
                  bottom: p.bottom,
                  width: p.w,
                  height: p.h,
                  zIndex: p.z,
                  animationDelay: `${Math.min(i, 14) * 55}ms`,
                  transform: `rotate(${p.rot}deg)`,
                  ["--sticker-rot"]: `${p.rot}deg`,
                } as CSSProperties
              }
            >
              <StickerImg blob={s.sticker} alt={s.title} className="h-full w-full select-none object-contain" />
            </button>
          );
        })
      )}
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
