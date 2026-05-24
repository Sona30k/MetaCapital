import { Badge } from "../ui/Badge";
import type { Quote } from "../../api/types";

export function TickerTape({
  status,
  quotes,
}: {
  status: "connecting" | "open" | "closed" | "error";
  quotes: Record<string, Quote>;
}) {
  return (
    <div className="flex items-center gap-3 overflow-auto rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="shrink-0">
        <Badge tone={status === "open" ? "success" : status === "connecting" ? "warn" : "danger"}>
          {status.toUpperCase()}
        </Badge>
      </div>
      <div className="flex min-w-0 gap-3">
        {Object.values(quotes).length === 0 ? (
          <span className="text-sm text-base-200/70">Waiting for quotes…</span>
        ) : (
          Object.values(quotes)
            .sort((a, b) => a.ticker.localeCompare(b.ticker))
            .map((q) => (
              <div key={q.ticker} className="flex items-baseline gap-2 rounded-xl bg-white/5 px-3 py-2">
                <span className="text-xs font-semibold text-white">{q.ticker}</span>
                <span className="text-sm font-mono text-base-200">{q.price.toFixed(2)}</span>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
