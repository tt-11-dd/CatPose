import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATS } from "../types";
import { logout, resetAll, saveProfile, stickersOf, useApp } from "../lib/state";
import { CatLogo } from "../ui/CatLogo";
import { PageHeader } from "../ui/PageHeader";

export function ProfilePage() {
  const { stickers, profile, user, cloud } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(profile.nickname);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto px-5 pt-[max(14px,env(safe-area-inset-top))]">
      <PageHeader title="我的" />

      <div className="mt-8 flex flex-col items-center">
        <CatLogo size={96} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void saveProfile({ nickname: name.trim() || "猫奴" })}
          className="font-display mt-3 w-40 bg-transparent text-center text-xl font-semibold text-ink outline-none"
        />
        <p className="text-sm text-muted">
          {user ? user.email : "未登录，贴纸只存在这台设备"}
        </p>
      </div>

      <section className="mt-8 rounded-[22px] bg-white p-4">
        <h2 className="font-display text-base font-semibold text-ink">家里的猫咪</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {CATS.map((c) => (
            <div key={c.slug} className="rounded-2xl bg-banner/60 px-3 py-3 text-center">
              <p className="font-display text-lg font-semibold">{c.name}</p>
              <p className="text-xs text-muted">{stickersOf(c.slug, stickers).length} 张贴纸</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-[22px] bg-white p-4">
        <h2 className="font-display text-base font-semibold text-ink">账号</h2>
        {user ? (
          <button
            type="button"
            className="mt-3 w-full rounded-2xl bg-cream py-3 text-sm font-bold"
            onClick={() => void logout()}
          >
            退出登录
          </button>
        ) : (
          <button
            type="button"
            className="mt-3 w-full rounded-2xl bg-honey py-3 text-sm font-bold"
            onClick={() => navigate("/login")}
          >
            {cloud ? "登录 / 注册" : "登录（需连接云端）"}
          </button>
        )}
        {!cloud && (
          <p className="mt-2 text-xs text-muted">本地开发没挂上 Worker 时，登录会不可用。</p>
        )}
      </section>

      {!user && (
        <button
          type="button"
          onClick={() => {
            if (confirm("清空本机贴纸？")) void resetAll();
          }}
          className="mt-6 text-sm text-muted underline"
        >
          清空本地收藏
        </button>
      )}
      <p className="mt-4 pb-8 text-center text-xs text-muted">
        一点 {stickersOf("yidian", stickers).length} · 十一 {stickersOf("shiyi", stickers).length}
      </p>
    </div>
  );
}
