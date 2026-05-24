import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { API_BASE_URL } from "../../api/config";
import { getHealth } from "../../api/client";
import { Badge } from "../ui/Badge";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "block rounded-xl px-3 py-2 text-sm transition",
    isActive ? "bg-white/10 text-white" : "text-base-200 hover:bg-white/5 hover:text-white",
  ].join(" ");

export function AppShell({ children }: { children: ReactNode }) {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let active = true;
    getHealth()
      .then(() => active && setApiStatus("online"))
      .catch(() => active && setApiStatus("offline"));

    const interval = window.setInterval(() => {
      getHealth()
        .then(() => active && setApiStatus("online"))
        .catch(() => active && setApiStatus("offline"));
    }, 30_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-black/20 p-4 md:flex">
        <div className="mb-6">
          <div className="text-lg font-extrabold tracking-tight text-white">MetaCapital</div>
          <div className="text-xs text-base-200/70">AI multi-agent financial terminal</div>
        </div>

        <nav className="space-y-1">
          <NavLink to="/" className={navLinkClass} end>
            Terminal
          </NavLink>
          <NavLink to="/strategies" className={navLinkClass}>
            Strategy Lab
          </NavLink>
          <NavLink to="/portfolio" className={navLinkClass}>
            Paper Portfolio
          </NavLink>
          <NavLink to="/insights" className={navLinkClass}>
            News & Sentiment
          </NavLink>
        </nav>

        <div className="mt-auto space-y-2 pt-6 text-xs text-base-200/60">
          <Badge tone={apiStatus === "online" ? "success" : apiStatus === "checking" ? "warn" : "danger"}>
            API {apiStatus.toUpperCase()}
          </Badge>
          <div className="break-all">{API_BASE_URL}</div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/10 bg-black/10 px-4 py-3 md:hidden">
          <div className="text-sm font-semibold text-white">MetaCapital</div>
          <Badge tone={apiStatus === "online" ? "success" : apiStatus === "checking" ? "warn" : "danger"}>
            API {apiStatus.toUpperCase()}
          </Badge>
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
