import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import type { CompareResponse } from "../api/types";

const DEFAULT_STRATEGIES = ["buy_hold", "ma_crossover", "rsi_mean_reversion", "vol_breakout"] as const;

export default function StrategyLab() {
  const [ticker, setTicker] = useState("AAPL");
  const [runKey, setRunKey] = useState(0);

  const { data, loading, error, run } = useAsync<CompareResponse>(
    async () => {
      const res = await api.post<CompareResponse>("/backtest/compare", {
        ticker,
        strategies: DEFAULT_STRATEGIES,
        initial_cash: 10_000,
      });
      return res.data;
    },
    [ticker, runKey]
  );

  const merged = useMemo(() => {
    const results = data?.results ?? [];
    if (results.length === 0) return [];

    // Merge equity curves by timestamp.
    const map = new Map<string, Record<string, number | string>>();
    for (const r of results) {
      for (const pt of r.equity_curve) {
        const key = pt.ts;
        const row = map.get(key) ?? { ts: key };
        row[r.strategy] = pt.equity;
        map.set(key, row);
      }
    }
    return Array.from(map.values()).sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }, [data]);

  return (
    <div className="space-y-4">
      <Panel
        title="Strategy Lab"
        right={
          <div className="flex items-center gap-2">
            <Input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} className="w-28" />
            <Button
              onClick={() => {
                setRunKey((x) => x + 1);
                void run();
              }}
              disabled={loading}
            >
              {loading ? "Running…" : "Run"}
            </Button>
          </div>
        }
      >
        <div className="text-sm text-base-200/70">
          Runs a vectorized backtest for each built-in strategy and compares metrics side-by-side.
        </div>
      </Panel>

      {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Equity curves" className="h-[420px]">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={merged}>
                <XAxis
                  dataKey="ts"
                  tickFormatter={(v) => new Date(v).toLocaleDateString()}
                  stroke="rgba(255,255,255,0.35)"
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="rgba(255,255,255,0.35)"
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(0,0,0,0.85)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="buy_hold" dot={false} stroke="#A78BFA" />
                <Line type="monotone" dataKey="ma_crossover" dot={false} stroke="#22C55E" />
                <Line type="monotone" dataKey="rsi_mean_reversion" dot={false} stroke="#F59E0B" />
                <Line type="monotone" dataKey="vol_breakout" dot={false} stroke="#EF4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-base-200/60">All strategies are long-only for a clean comparison baseline.</div>
        </Panel>

        <Panel title="Metrics">
          {loading && !data ? (
            <div className="text-sm text-base-200/70">Loading…</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-base-200/70">
                  <tr>
                    <th className="py-2">Strategy</th>
                    <th className="py-2">CAGR</th>
                    <th className="py-2">Sharpe</th>
                    <th className="py-2">Max DD</th>
                    <th className="py-2">Win rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.results ?? []).map((r) => (
                    <tr key={r.strategy} className="border-t border-white/10">
                      <td className="py-2 font-semibold text-white">{r.strategy}</td>
                      <td className="py-2">{(r.metrics.cagr * 100).toFixed(1)}%</td>
                      <td className="py-2">{r.metrics.sharpe.toFixed(2)}</td>
                      <td className="py-2">{(r.metrics.max_drawdown * 100).toFixed(1)}%</td>
                      <td className="py-2">{(r.metrics.win_rate * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
