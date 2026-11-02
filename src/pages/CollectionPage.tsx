import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLLECTION_TABS, type CategoryId } from "../types";
import { categoryOf, useApp } from "../lib/state";
import { StickerGrid } from "../ui/StickerWall";

export function CollectionPage() {
  const { stickers } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | CategoryId>("all");
  const shown = categoryOf(tab, stickers);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto px-5 pt-[max(14px,env(safe-area-inset-top))]">
      <header className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="grid size-9 place-items-center text-ink"
          aria-label="返回"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="flex-1 font-display text-xl font-semibold text-ink">我的收藏</h1>
        <span className="rounded-full bg-banner px-2.5 py-0.5 text-sm font-bold text-honey-dark">
          {stickers.length}
        </span>
      </header>

      <div className="mt-4 flex gap-2 overflow-x-auto text-sm font-bold">
        {COLLECTION_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 ${
              tab === t.id ? "bg-honey text-ink" : "text-muted"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="mt-4 pb-6">
        <StickerGrid stickers={shown} onOpen={(id) => navigate(`/sticker/${id}`)} />
      </div>
    </div>
  );
}
