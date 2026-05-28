import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";
import { CorrelationHeatmap } from "../components/analytics/CorrelationHeatmap";
import { MetricTile } from "../components/analytics/MetricTile";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Panel } from "../components/ui/Panel";
import { useAsync } from "../hooks/useAsync";
import type { AnalyticsResponse, AnalyticsTimeRange } from "../api/types";

const DEFAULT_TICKERS = "AAPL,MSFT,GOOGL,TSLA";
const TIME_RANGES: AnalyticsTimeRange[] = ["1M", "3M", "1Y"];

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function toneForScore(value: number) {
  if (value >= 65) return "success";
  if (value >= 40) return "warn";
  return "danger";
}

function queryString(tickers: string[], range: AnalyticsTimeRange, benchmark: string) {
  const params = new URLSearchParams({ range, benchmark });
  for (const ticker of tickers) params.append("tickers", ticker);
  return params.toString();
}

export default function Analytics() {
  const [tickerInput, setTickerInput] = useState(DEFAULT_TICKERS);
  const [benchmark, setBenchmark] = useState("SPY");
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("1Y");
  const [runKey, setRunKey] = useState(0);

  const tickers = useMemo(
    () =>
      tickerInput
        .split(",")
        .map((ticker) => ticker.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 8),
    [tickerInput],
  );

  const { data, loading, error, run } = useAsync<AnalyticsResponse>(
    async () => {
      const qs = queryString(tickers, timeRange, benchmark.toUpperCase());
      const res = await api.get<AnalyticsResponse>(`/analytics/overview?${qs}`);
      return res.data;
    },
    [runKey],
  );

  return (
    <div className="space-y-4">
      <Panel
        title="Risk Intelligence"
        right={
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_96px_auto]">
            <Input value={tickerInput} onChange={(e) => setTickerInput(e.target.value)} className="w-52" />
            <Input value={benchmark} onChange={(e) => setBenchmark(e.target.value.toUpperCase())} className="w-24" />
            <Button
              onClick={() => {
                setRunKey((x) => x + 1);
                void run();
              }}
              disabled={loading || tickers.length < 2}
            >
              {loading ? "Loading..." : "Analyze"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-base-200/70">
            Correlation, alpha/beta, Sharpe, portfolio risk, and Monte Carlo simulation in one clean view.
          </div>
          <div className="flex gap-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  timeRange === range
                    ? "border-accent-400 bg-accent-500/30 text-white"
                    : "border-white/10 bg-white/5 text-base-200"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricTile
              label="Portfolio volatility"
              value={pct(data.portfolio_risk.volatility)}
              detail={data.portfolio_risk.interpretation}
              tone={data.portfolio_risk.volatility < 0.25 ? "success" : "warn"}
            />
            <MetricTile
              label="Diversification"
              value={`${data.portfolio_risk.diversification_score.toFixed(0)}/100`}
              detail="Based on average absolute cross-asset correlation."
              tone={toneForScore(data.portfolio_risk.diversification_score)}
            />
            <MetricTile
              label="Max drawdown"
              value={pct(data.portfolio_risk.max_drawdown)}
              detail="Worst historical equal-weight portfolio decline."
              tone={data.portfolio_risk.max_drawdown > -0.12 ? "success" : "danger"}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Correlation Heatmap">
              <CorrelationHeatmap cells={data.correlation} tickers={data.tickers} />
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-base-200/80">
                {data.correlation_interpretation}
              </div>
            </Panel>

            <Panel title="Alpha & Beta Analytics" className="min-w-0">
              <div className="h-[310px] min-h-[310px] min-w-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="volatility"
                      name="Volatility"
                      tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <YAxis
                      dataKey="annual_return"
                      name="Annual return"
                      tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-white/10 bg-black/90 p-3 text-xs text-base-200">
                            <div className="mb-1 font-semibold text-white">{point.ticker}</div>
                            <div>Beta: {point.beta.toFixed(2)}</div>
                            <div>Alpha: {pct(point.alpha)}</div>
                            <div>Sharpe: {point.sharpe.toFixed(2)}</div>
                          </div>
                        );
                      }}
                    />
                    <Scatter name="Assets" data={data.alpha_beta} fill="#A78BFA" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                {data.alpha_beta.map((item) => (
                  <div key={item.ticker} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="font-semibold text-white">{item.ticker}</div>
                    <div className="mt-1 text-base-200/70">{item.interpretation}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title="Monte Carlo Portfolio Simulation" className="min-w-0">
            <div className="h-[340px] min-h-[340px] min-w-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monte_carlo}>
                  <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(0,0,0,0.86)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="p10" name="Bear case" dot={false} stroke="#EF4444" />
                  <Line type="monotone" dataKey="p50" name="Median" dot={false} stroke="#22C55E" strokeWidth={2} />
                  <Line type="monotone" dataKey="p90" name="Bull case" dot={false} stroke="#A78BFA" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </>
      ) : loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-base-200/70">
          Loading analytics...
        </div>
      ) : null}
    </div>
  );
}
