import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { useSessionId } from "../hooks/useSessionId";
import { Panel } from "../components/ui/Panel";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import type { PlaceOrderRequest, PortfolioSnapshot } from "../api/types";

export default function Portfolio() {
  const sessionId = useSessionId();
  const [order, setOrder] = useState<PlaceOrderRequest>({ ticker: "AAPL", side: "BUY", qty: 1 });

  const { data, loading, error, run } = useAsync<PortfolioSnapshot>(
    async () => {
      const res = await api.get<PortfolioSnapshot>("/portfolio/snapshot", { headers: { "X-Session-Id": sessionId } });
      return res.data;
    },
    [sessionId]
  );

  const placeOrder = async () => {
    await api.post<PortfolioSnapshot>("/portfolio/orders", order, { headers: { "X-Session-Id": sessionId } });
    await run();
  };

  const reset = async () => {
    await api.post<PortfolioSnapshot>("/portfolio/reset", {}, { headers: { "X-Session-Id": sessionId } });
    await run();
  };

  return (
    <div className="space-y-4">
      <Panel title="Paper Portfolio" right={<div className="text-xs text-base-200/60">Session: {sessionId.slice(0, 8)}…</div>}>
        <div className="text-sm text-base-200/70">
          Simulated trading with fake money. Orders are filled at the latest streamed market price.
        </div>
      </Panel>

      {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Order ticket">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={order.ticker}
                onChange={(e) => setOrder((o) => ({ ...o, ticker: e.target.value.toUpperCase() }))}
                placeholder="Ticker"
              />
              <select
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-base-200"
                value={order.side}
                onChange={(e) => setOrder((o) => ({ ...o, side: e.target.value as PlaceOrderRequest["side"] }))}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <Input
              type="number"
              min={0.0001}
              step="0.01"
              value={order.qty}
              onChange={(e) => setOrder((o) => ({ ...o, qty: Number(e.target.value) }))}
            />
            <div className="flex gap-2">
              <Button onClick={placeOrder} disabled={loading}>
                Place
              </Button>
              <Button variant="ghost" onClick={reset} disabled={loading}>
                Reset
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="Account" className="lg:col-span-2">
          {!data ? (
            <div className="text-sm text-base-200/70">{loading ? "Loading…" : "No data"}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-base-200/60">Cash</div>
                <div className="mt-1 font-mono text-white">{data.account.cash.toFixed(2)}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-base-200/60">Equity</div>
                <div className="mt-1 font-mono text-white">{data.account.equity.toFixed(2)}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-base-200/60">PnL</div>
                <div className="mt-1 font-mono text-white">{data.account.pnl.toFixed(2)}</div>
              </div>
            </div>
          )}

          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-base-200/70">
                <tr>
                  <th className="py-2">Ticker</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Avg</th>
                  <th className="py-2">Mkt</th>
                  <th className="py-2">PnL</th>
                </tr>
              </thead>
              <tbody>
                {(data?.positions ?? []).length === 0 ? (
                  <tr className="border-t border-white/10">
                    <td className="py-3 text-base-200/70" colSpan={5}>
                      No positions.
                    </td>
                  </tr>
                ) : (
                  (data?.positions ?? []).map((p) => (
                    <tr key={p.ticker} className="border-t border-white/10">
                      <td className="py-2 font-semibold text-white">{p.ticker}</td>
                      <td className="py-2 font-mono">{p.qty.toFixed(2)}</td>
                      <td className="py-2 font-mono">{p.avg_price.toFixed(2)}</td>
                      <td className="py-2 font-mono">{p.market_price.toFixed(2)}</td>
                      <td className={`py-2 font-mono ${p.pnl >= 0 ? "text-success" : "text-danger"}`}>
                        {p.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
