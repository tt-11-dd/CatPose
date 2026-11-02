import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export function PageHeader({ title, right }: { title: ReactNode; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="relative flex h-11 items-center">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute -left-2 z-10 grid size-9 place-items-center text-ink"
        aria-label="返回"
      >
        <ChevronLeft className="size-6" />
      </button>
      <h1 className="w-full px-9 text-center font-display text-[17px] font-semibold text-ink">
        {title}
      </h1>
      {right ? <div className="absolute right-0 z-10">{right}</div> : null}
    </header>
  );
}
