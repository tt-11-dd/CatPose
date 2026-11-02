import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATS, type CatSlug } from "../types";
import { stickersOf, useApp } from "../lib/state";
import { PageHeader } from "../ui/PageHeader";
import { StickerGrid } from "../ui/StickerWall";

export function CollectionPage() {
  const { stickers } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<CatSlug | "all">("all");
  const shown = stickersOf(tab, stickers);
  const tabs = [{ slug: "all" as const, name: "全部" }, ...CATS];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto px-5 pt-[max(14px,env(safe-area-inset-top))]">
      <PageHeader
        title="我的收藏"
        right={
          <span className="rounded-full bg-banner px-2.5 py-0.5 text-sm font-bold text-honey-dark">
            {stickers.length}
          </span>
        }
      />

      <div className="mt-4 flex gap-2 text-sm font-bold">
        {tabs.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => setTab(t.slug)}
            className={`flex-1 rounded-full py-1.5 ${
              tab === t.slug ? "bg-honey text-ink" : "bg-white text-muted"
            }`}
          >
            {t.name}
            <span className="ml-1 text-xs opacity-70">
              {t.slug === "all" ? stickers.length : stickersOf(t.slug, stickers).length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 pb-6">
        <StickerGrid stickers={shown} onOpen={(id) => navigate(`/sticker/${id}`)} />
      </div>
    </div>
  );
}
