import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../lib/state";
import { CatLogo } from "../ui/CatLogo";
import { Screen } from "../ui/AppShell";

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, nickname);
      navigate("/profile", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen className="flex flex-col px-6">
      <header className="flex items-center pt-[max(14px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="grid size-10 place-items-center text-ink"
          aria-label="返回"
        >
          <ChevronLeft className="size-7" />
        </button>
      </header>
      <div className="mx-auto mt-6 flex flex-col items-center">
        <CatLogo size={88} />
        <h1 className="font-display mt-3 text-2xl font-semibold">
          {mode === "login" ? "登录 CatPose" : "注册 CatPose"}
        </h1>
        <p className="mt-1 text-sm text-muted">收藏会同步到云端</p>
      </div>
      <form className="mt-8 flex flex-col gap-3" onSubmit={(e) => void submit(e)}>
        {mode === "register" && (
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="怎么称呼你"
            className="rounded-2xl bg-white px-4 py-3 text-sm outline-none"
          />
        )}
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
          required
          className="rounded-2xl bg-white px-4 py-3 text-sm outline-none"
        />
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码，至少 6 位"
          required
          minLength={6}
          className="rounded-2xl bg-white px-4 py-3 text-sm outline-none"
        />
        {error && <p className="text-sm text-[#c45c5c]">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-[22px] bg-honey py-3.5 text-sm font-bold disabled:opacity-50"
        >
          {busy ? "请稍等…" : mode === "login" ? "登录" : "注册"}
        </button>
      </form>
      <button
        type="button"
        className="mt-4 pb-[max(20px,env(safe-area-inset-bottom))] text-sm text-muted"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError("");
        }}
      >
        {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
      </button>
    </Screen>
  );
}
