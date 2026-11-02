import { ChevronLeft, Lock, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ACHIEVEMENTS, POSE_GOAL } from "../types";
import { useApp } from "../lib/state";
import { CatLogo } from "../ui/CatLogo";
import { PawPrint } from "../ui/PawPrint";

export function AchievementsPage() {
  const { stickers } = useApp();
  const navigate = useNavigate();
  const n = stickers.length;
  const pct = Math.min(100, (n / POSE_GOAL) * 100);
  const r = 58;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

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
        <h1 className="flex items-center gap-1.5 font-display text-xl font-semibold text-ink">
          <Trophy className="size-5 text-honey-dark" />
          成就
        </h1>
      </header>

      <div className="relative mx-auto mt-8 grid place-items-center">
        <PawPrint size={22} className="absolute top-2 left-2 text-paw" />
        <PawPrint size={18} className="absolute right-4 bottom-6 text-paw" />
        <svg width="168" height="168" viewBox="0 0 168 168">
          <circle cx="84" cy="84" r={r} fill="none" stroke="#F3E6D0" strokeWidth="10" />
          <circle
            cx="84"
            cy="84"
            r={r}
            fill="none"
            stroke="#E8A317"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform="rotate(-90 84 84)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <CatLogo size={56} />
          <p className="font-display mt-1 text-lg font-semibold text-ink">
            {n} / {POSE_GOAL}
          </p>
        </div>
      </div>
      <p className="mt-2 text-center text-sm text-muted">已收集 {n} 个姿势</p>

      <h2 className="mt-8 font-display text-base font-semibold text-ink">收集成就</h2>
      <div className="mt-4 grid grid-cols-3 gap-3 pb-8">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = n >= a.need;
          return (
            <div key={a.id} className="flex flex-col items-center text-center">
              <div
                className={`grid size-16 place-items-center rounded-3xl ${
                  unlocked ? "bg-honey" : "bg-[#efe3d2] text-muted"
                }`}
              >
                {unlocked ? (
                  <PawPrint size={28} className="text-[#C9844A]" />
                ) : (
                  <Lock className="size-6" />
                )}
              </div>
              <p className="mt-2 text-sm font-bold text-ink">{a.name}</p>
              <p className={`text-xs ${unlocked ? "text-honey-dark" : "text-muted"}`}>
                {unlocked ? "已达成" : "未解锁"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
