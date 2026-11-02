import { ChevronLeft, Download, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CATS, catName } from "../types";
import { removeSticker, updateSticker, useApp } from "../lib/state";
import { Screen } from "../ui/AppShell";
import { StickerImg } from "../ui/StickerWall";

export function StickerDetailPage() {
  const { id } = useParams();
  const { stickers } = useApp();
  const navigate = useNavigate();
  const sticker = stickers.find((s) => s.id === id);
  const [title, setTitle] = useState(sticker?.title ?? "");
  const [deleting, setDeleting] = useState(false);

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
    a.download = `${current.title || catName(current.catId)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Screen className="flex flex-col">
      <header className="flex items-center px-5 pt-[max(14px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="grid size-10 place-items-center text-ink"
          aria-label="返回"
        >
          <ChevronLeft className="size-7" />
        </button>
        <h1 className="flex-1 font-display text-lg font-semibold">{catName(sticker.catId)}</h1>
      </header>

      <div className="mx-6 mt-2 flex flex-1 items-center justify-center rounded-[28px] checker p-6">
        <StickerImg blob={sticker.sticker} alt={sticker.title} className="max-h-[52svh] object-contain" />
      </div>

      <div className="px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          {CATS.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => void updateSticker(sticker.id, { catId: c.slug })}
              className={`flex-1 rounded-full py-2 text-sm font-bold ${
                sticker.catId === c.slug ? "bg-honey text-ink" : "bg-white text-muted"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => void updateSticker(sticker.id, { title: title.trim() })}
          placeholder="备注，可不填"
          className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
        />
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
            disabled={deleting}
            onClick={() => {
              if (deleting || !confirm("删除这张贴纸？")) return;
              setDeleting(true);
              void removeSticker(sticker.id)
                .then(() => navigate("/", { replace: true }))
                .finally(() => setDeleting(false));
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-[22px] bg-white py-3.5 text-sm font-bold text-[#c45c5c] disabled:opacity-50"
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {deleting ? "删除中…" : "删除"}
          </button>
        </div>
      </div>
    </Screen>
  );
}
