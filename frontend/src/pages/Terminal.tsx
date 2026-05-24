import { useMemo, useState } from "react";
import { useQuotesWs } from "../hooks/useQuotesWs";
import { TickerTape } from "../components/terminal/TickerTape";
import { PriceChart } from "../components/terminal/PriceChart";
import { DebatePanel } from "../components/terminal/DebatePanel";
import { NewsPanel } from "../components/terminal/NewsPanel";
import { Panel } from "../components/ui/Panel";

const DEFAULT_TICKERS = ["AAPL", "TSLA", "MSFT", "GOOGL"];

export default function Terminal() {
  const [tickers] = useState(DEFAULT_TICKERS);
  const [active, setActive] = useState("AAPL");
  const ws = useQuotesWs(tickers);

  const series = ws.series[active] ?? [];
  const lastPrice = ws.quotes[active]?.price;

  const options = useMemo(() => tickers.map((t) => t.toUpperCase()), [tickers]);

  return (
    <div className="space-y-4">
      <TickerTape status={ws.status} quotes={ws.quotes} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel
            title="Market"
            right={
              <div className="flex items-center gap-2">
                <select
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-base-200"
                  value={active}
                  onChange={(e) => setActive(e.target.value)}
                >
                  {options.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {lastPrice !== undefined && (
                  <div className="rounded-xl bg-white/5 px-3 py-2 text-sm text-base-200">
                    Last: <span className="font-mono">{lastPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <PriceChart ticker={active} points={series} />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <DebatePanel ticker={active} />
          <NewsPanel ticker={active} />
        </div>
      </div>
    </div>
  );
}

