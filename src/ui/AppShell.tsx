import { NavLink, Outlet } from "react-router-dom";
import { Grid2x2, House, Trophy, UserRound } from "lucide-react";

const items = [
  { to: "/", label: "首页", icon: House, end: true },
  { to: "/collection", label: "收藏", icon: Grid2x2 },
  { to: "/achievements", label: "成就", icon: Trophy },
  { to: "/profile", label: "我的", icon: UserRound },
] as const;

export function AppShell() {
  return (
    <div className="phone-shell flex h-svh flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
      <nav className="shrink-0 px-5 pt-1 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around rounded-[28px] bg-white px-2 py-2.5 shadow-[0_10px_30px_rgba(80,50,20,0.12)]">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item ? item.end : false}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1 text-[11px] font-bold"
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    strokeWidth={isActive ? 2.4 : 1.9}
                    className={isActive ? "size-[22px] text-honey-dark" : "size-[22px] text-muted"}
                  />
                  <span className={isActive ? "text-honey-dark" : "text-muted"}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Screen({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`phone-shell flex min-h-svh flex-col ${className}`}>{children}</div>;
}
