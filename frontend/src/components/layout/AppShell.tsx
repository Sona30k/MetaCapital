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
  const [apiStatus, setApiStatus] = useState<"checking" | "waking" | "online" | "offline">("checking");

  useEffect(() => {
    let active = true;
    let attempts = 0;
    let timer: number | undefined;

    const checkHealth = async () => {
      attempts += 1;
      try {
        await getHealth();
        if (!active) return;
        attempts = 0;
        setApiStatus("online");
        timer = window.setTimeout(checkHealth, 30_000);
      } catch {
        if (!active) return;
        setApiStatus(attempts <= 20 ? "waking" : "offline");
        timer = window.setTimeout(checkHealth, attempts <= 20 ? 4_000 : 30_000);
      }
    };

    void checkHealth();

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const apiTone = apiStatus === "online" ? "success" : apiStatus === "offline" ? "danger" : "warn";
  const apiLabel = apiStatus === "waking" ? "API WAKING" : `API ${apiStatus.toUpperCase()}`;

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-black/20 p-4 md:flex">
        <div className="mb-6">
          <div className="text-lg font-extrabold tracking-tight text-white">MetaCapital</div>
          <div className="text-xs text-base-200/70">AI multi-agent financial terminal</div>
        </div>

        <nav className="space-y-1">
          <NavLink to="/" className={navLinkClass} end>
            Command Center
          </NavLink>
          <NavLink to="/strategies" className={navLinkClass}>
            Strategy Lab
          </NavLink>
          <NavLink to="/analytics" className={navLinkClass}>
            Risk Analytics
          </NavLink>
          <NavLink to="/portfolio" className={navLinkClass}>
            Paper Portfolio
          </NavLink>
          <NavLink to="/insights" className={navLinkClass}>
            News & Sentiment
          </NavLink>
        </nav>

        <div className="mt-auto space-y-2 pt-6 text-xs text-base-200/60">
          <Badge tone={apiTone}>{apiLabel}</Badge>
          <div className="break-all">{API_BASE_URL}</div>
          {apiStatus === "waking" && <div>Free Render services can take a moment to wake up.</div>}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/10 bg-black/10 px-4 py-3 md:hidden">
          <div className="text-sm font-semibold text-white">MetaCapital</div>
          <Badge tone={apiTone}>{apiLabel}</Badge>
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
