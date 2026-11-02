import { Camera, ChevronRight, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { startFromFile, useApp } from "../lib/state";
import { CatLogo } from "../ui/CatLogo";
import { PawPrint } from "../ui/PawPrint";
import { StickerWall } from "../ui/StickerWall";

export function HomePage() {
  const { stickers } = useApp();
  const navigate = useNavigate();

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        void startFromFile(file).then(() => navigate("/editor"));
      }}
    >
      <header className="flex items-center justify-between px-5 pt-[max(18px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5">
          <CatLogo size={46} />
          <div>
            <h1 className="font-display text-[28px] leading-none font-semibold text-ink">
              CatPose
            </h1>
            <p className="font-hand mt-0.5 text-[17px] leading-none text-muted">
              Collect cute cat poses!
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="设置"
          onClick={() => navigate("/profile")}
          className="grid size-10 place-items-center rounded-full text-ink/70"
        >
          <Settings className="size-6" />
        </button>
      </header>

      <button
        type="button"
        onClick={() => navigate("/capture")}
        className="mx-5 mt-5 flex items-center gap-3 rounded-[22px] bg-banner px-4 py-3.5 text-left shadow-[0_6px_16px_rgba(232,176,70,0.18)]"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-[#C9844A] text-white">
          <Camera className="size-6" />
        </span>
        <span className="flex-1">
          <span className="block font-display text-[18px] font-semibold text-ink">
            拍一只猫咪
          </span>
          <span className="mt-0.5 block text-[13px] text-muted">收集它的可爱姿势吧！</span>
        </span>
        <ChevronRight className="size-5 text-muted" />
      </button>

      <div className="relative mt-2 min-h-0 flex-1">
        <StickerWall stickers={stickers} onOpen={(id) => navigate(`/sticker/${id}`)} />
      </div>

      <div className="flex justify-end px-5 pb-3">
        <div className="flex items-center gap-2 rounded-full bg-banner px-4 py-2 text-sm font-bold text-ink shadow-sm">
          <PawPrint size={18} className="text-honey-dark" />
          <span>
            已收集 <span className="text-honey-dark">{stickers.length}</span> 个姿势
          </span>
        </div>
      </div>
    </div>
  );
}
