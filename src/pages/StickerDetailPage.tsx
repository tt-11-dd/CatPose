import { ChevronLeft, Download, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CATEGORIES } from "../types";
import { removeSticker, updateSticker, useApp } from "../lib/state";
import { Screen } from "../ui/AppShell";
import { StickerImg } from "../ui/StickerWall";

export function StickerDetailPage() {
  const { id } = useParams();
  const { stickers } = useApp();
  const navigate = useNavigate();
  const sticker = stickers.find((s) => s.id === id);
  const [title, setTitle] = useState(sticker?.title ?? "");

  useEffect(() => {
    setTitle(sticker?.title ?? "");
  }, [sticker?.title]);

  if (!sticker) {
    return (
      <Screen className="grid place-items-center">
        <p className="text-muted">贴纸不在了</p>
      </Screen>
    );
  }

  const current = sticker;
  function download() {
    const url = URL.createObjectURL(current.sticker);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${current.title || "catpose"}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Screen className="flex flex-col">
      <header className="flex items-center px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="grid size-10 place-items-center text-ink"
          aria-label="返回"
        >
          <ChevronLeft className="size-7" />
        </button>
        <h1 className="flex-1 font-display text-lg font-semibold">贴纸</h1>
      </header>

      <div className="mx-6 mt-2 flex flex-1 items-center justify-center rounded-[28px] checker p-6">
        <StickerImg blob={sticker.sticker} alt={sticker.title} className="max-h-[52svh] object-contain" />
      </div>

      <div className="px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => void updateSticker(sticker.id, { title: title.trim() || "猫咪姿势" })}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
        />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => void updateSticker(sticker.id, { categoryId: c.id })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                sticker.categoryId === c.id ? "bg-honey text-ink" : "bg-white text-muted"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={download}
            className="flex flex-1 items-center justify-center gap-2 rounded-[22px] bg-white py-3.5 text-sm font-bold"
          >
            <Download className="size-4" />
            下载 PNG
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm("删除这张贴纸？")) return;
              void removeSticker(sticker.id).then(() => navigate("/", { replace: true }));
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-[22px] bg-white py-3.5 text-sm font-bold text-[#c45c5c]"
          >
            <Trash2 className="size-4" />
            删除
          </button>
        </div>
      </div>
    </Screen>
  );
}
