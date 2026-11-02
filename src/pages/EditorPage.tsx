import { Check, ChevronLeft, Scissors } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../types";
import { patchDraft, processDraft, saveDraft, useApp } from "../lib/state";
import { Screen } from "../ui/AppShell";
import { StickerImg } from "../ui/StickerWall";

export function EditorPage() {
  const { draft } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!draft) navigate("/capture", { replace: true });
  }, [draft, navigate]);

  if (!draft) return null;

  async function onSave() {
    const id = await saveDraft();
    if (id) navigate("/", { replace: true });
  }

  return (
    <Screen className="flex flex-col bg-cream">
      <header className="flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="grid size-10 place-items-center text-ink"
          aria-label="返回"
        >
          <ChevronLeft className="size-7" />
        </button>
        <span className="font-display text-base font-semibold text-ink">贴纸预览</span>
        <span className="size-10" />
      </header>

      <div className="relative mx-6 mt-2 flex-1 overflow-hidden rounded-[28px] checker">
        {(draft.status === "processing" || !draft.sticker) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-cream/40 px-8 text-center">
            {draft.status === "failed" ? (
              <>
                <p className="font-display text-lg font-semibold text-ink">没抠出来</p>
                <p className="mt-2 text-sm text-muted">{draft.error}</p>
                <button
                  type="button"
                  onClick={() => void processDraft()}
                  className="mt-5 rounded-full bg-honey px-5 py-2 text-sm font-bold text-ink"
                >
                  再试一次
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 size-12 animate-bounce rounded-full bg-honey" />
                <p className="font-display text-lg font-semibold text-ink">正在变成贴纸</p>
                <p className="mt-2 text-sm text-muted">{draft.progress || "请稍等…"}</p>
                <p className="mt-1 text-xs text-muted">第一次会下载模型，可能要一会儿</p>
              </>
            )}
          </div>
        )}
        {draft.sticker && (
          <div className="flex h-full items-center justify-center p-6">
            <span className="absolute top-10 right-8 text-2xl text-honey-dark">✦</span>
            <StickerImg blob={draft.sticker} alt="预览" className="max-h-full max-w-full object-contain" />
          </div>
        )}
      </div>

      <div className="px-5 pt-4">
        <input
          value={draft.title}
          onChange={(e) => patchDraft({ title: e.target.value })}
          placeholder="给这张贴纸起个名"
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink outline-none"
        />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => patchDraft({ categoryId: c.id })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                draft.categoryId === c.id ? "bg-honey text-ink" : "bg-white text-muted"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 mb-[max(16px,env(safe-area-inset-bottom))] flex gap-3 px-5">
        <button
          type="button"
          onClick={() => void processDraft()}
          disabled={draft.status === "processing"}
          className="flex flex-1 items-center justify-center gap-2 rounded-[22px] bg-white py-3.5 text-sm font-bold text-ink shadow-sm"
        >
          <Scissors className="size-5 text-muted" />
          重新抠图
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={!draft.sticker}
          className="flex flex-1 items-center justify-center gap-2 rounded-[22px] bg-honey py-3.5 text-sm font-bold text-ink shadow-sm disabled:opacity-50"
        >
          <Check className="size-5" />
          保存贴纸
        </button>
      </div>
    </Screen>
  );
}
