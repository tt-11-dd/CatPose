import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetAll, saveProfile, useApp } from "../lib/state";
import { CatLogo } from "../ui/CatLogo";

export function ProfilePage() {
  const { stickers, profile } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(profile.nickname);

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
        <h1 className="font-display text-xl font-semibold text-ink">我的</h1>
      </header>

      <div className="mt-8 flex flex-col items-center">
        <div className="grid size-24 place-items-center rounded-full bg-banner">
          <CatLogo size={72} />
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void saveProfile({ nickname: name.trim() || "猫奴" })}
          className="font-display mt-3 w-40 bg-transparent text-center text-xl font-semibold text-ink outline-none"
        />
        <p className="text-sm text-muted">已收集 {stickers.length} 张贴纸</p>
      </div>

      <section className="mt-8 rounded-[22px] bg-white p-4">
        <h2 className="font-display text-base font-semibold text-ink">猫咪档案</h2>
        <p className="mt-2 text-sm text-muted">
          这一期先把贴纸收藏跑通。多只猫咪的档案会留到下一版。
        </p>
      </section>

      <section className="mt-4 rounded-[22px] bg-white p-4">
        <h2 className="font-display text-base font-semibold text-ink">以后做成 App</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          现在是网站，手机浏览器也能当 App 用。后面用同一套页面打包安卓，拍照和收藏不用重做。
        </p>
      </section>

      <button
        type="button"
        onClick={() => {
          if (confirm("清空本地所有贴纸？")) void resetAll();
        }}
        className="mt-6 text-sm text-muted underline"
      >
        清空本地收藏
      </button>
    </div>
  );
}
