import type { ReactNode } from "react";

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "danger" | "warn"; children: ReactNode }) {
  const cls =
    tone === "success"
      ? "bg-success/20 text-success border-success/30"
      : tone === "danger"
        ? "bg-danger/20 text-danger border-danger/30"
        : tone === "warn"
          ? "bg-warn/20 text-warn border-warn/30"
          : "bg-white/10 text-base-200 border-white/10";
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}
