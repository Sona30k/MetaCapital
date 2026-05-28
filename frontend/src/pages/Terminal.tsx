import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
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
import type { AnalyticsResponse, AnalyticsTimeRange, CompareResponse, PortfolioSnapshot } from "../api/types";
import { CorrelationHeatmap } from "../components/analytics/CorrelationHeatmap";
import { MetricTile } from "../components/analytics/MetricTile";
import { useQuotesWs } from "../hooks/useQuotesWs";
import { TickerTape } from "../components/terminal/TickerTape";
import { PriceChart } from "../components/terminal/PriceChart";
import { DebatePanel } from "../components/terminal/DebatePanel";
import { NewsPanel } from "../components/terminal/NewsPanel";
import { Panel } from "../components/ui/Panel";
import { useAsync } from "../hooks/useAsync";

const DEFAULT_TICKERS = ["AAPL", "TSLA", "MSFT", "GOOGL"];
const DEFAULT_STRATEGIES = ["buy_hold", "ma_crossover", "rsi_mean_reversion", "vol_breakout"] as const;
const TIME_RANGES: AnalyticsTimeRange[] = ["1M", "3M", "1Y"];

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function money(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function Terminal() {
  const [tickers] = useState(DEFAULT_TICKERS);
  const [active, setActive] = useState("AAPL");
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("1Y");
  const ws = useQuotesWs(tickers);
  const analytics = useAsync<AnalyticsResponse>(
    async () => {
      const params = new URLSearchParams({ range: timeRange, benchmark: "SPY" });
      for (const ticker of tickers) params.append("tickers", ticker);
      const res = await api.get<AnalyticsResponse>(`/analytics/overview?${params.toString()}`);
      return res.data;
    },
    [tickers.join(","), timeRange],
  );
  const strategies = useAsync<CompareResponse>(
    async () => {
      const res = await api.post<CompareResponse>("/backtest/compare", {
        ticker: active,
        strategies: DEFAULT_STRATEGIES,
        initial_cash: 10_000,
      });
      return res.data;
    },
    [active],
  );
  const portfolio = useAsync<PortfolioSnapshot>(
    async () => {
      const res = await api.get<PortfolioSnapshot>("/portfolio/snapshot");
      return res.data;
    },
    [],
  );

  const series = ws.series[active] ?? [];
  const lastPrice = ws.quotes[active]?.price;

  const options = useMemo(() => tickers.map((t) => t.toUpperCase()), [tickers]);
  const strategyRows =
    strategies.data?.results.map((result) => ({
      name: result.strategy.replaceAll("_", " "),
      sharpe: Number(result.metrics.sharpe.toFixed(2)),
      return: Number((result.metrics.total_return * 100).toFixed(1)),
    })) ?? [];

  return (
    <div className="space-y-5">
      <Panel title="MetaCapital Command Center">
        <div className="grid gap-3 text-sm text-base-200/75 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-base-200/50">Live Market</div>
            <div className="mt-2 font-semibold text-white">WebSocket prices</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-base-200/50">AI Agents</div>
            <div className="mt-2 font-semibold text-white">Debate + reasoning</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-base-200/50">Risk Analytics</div>
            <div className="mt-2 font-semibold text-white">Correlation + beta</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-base-200/50">Paper Trading</div>
            <div className="mt-2 font-semibold text-white">Portfolio simulator</div>
          </div>
        </div>
      </Panel>

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

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile
          label="Portfolio volatility"
          value={analytics.data ? pct(analytics.data.portfolio_risk.volatility) : "--"}
          detail={analytics.loading ? "Loading risk model..." : analytics.data?.portfolio_risk.interpretation ?? "Risk model unavailable."}
          tone={analytics.data && analytics.data.portfolio_risk.volatility < 0.25 ? "success" : "warn"}
        />
        <MetricTile
          label="Diversification"
          value={analytics.data ? `${analytics.data.portfolio_risk.diversification_score.toFixed(0)}/100` : "--"}
          detail="Calculated from average cross-asset correlation."
          tone={
            analytics.data && analytics.data.portfolio_risk.diversification_score >= 65
              ? "success"
              : analytics.data && analytics.data.portfolio_risk.diversification_score < 40
                ? "danger"
                : "warn"
          }
        />
        <MetricTile
          label="Paper equity"
          value={portfolio.data ? money(portfolio.data.account.equity) : "--"}
          detail={portfolio.data ? `${money(portfolio.data.account.pnl)} open P/L` : "Loading portfolio..."}
          tone={portfolio.data && portfolio.data.account.pnl >= 0 ? "success" : "danger"}
        />
      </div>

      <Panel
        title="Analytics Timeline"
        right={
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
        }
      >
        <div className="text-sm text-base-200/70">
          These filters update correlation, Alpha/Beta, Sharpe, drawdown, and Monte Carlo simulation together.
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Correlation Heatmap">
          {analytics.error ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{analytics.error}</div>
          ) : analytics.data ? (
            <>
              <CorrelationHeatmap cells={analytics.data.correlation} tickers={analytics.data.tickers} />
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-base-200/80">
                {analytics.data.correlation_interpretation}
              </div>
            </>
          ) : (
            <div className="text-sm text-base-200/70">Loading correlation model...</div>
          )}
        </Panel>

        <Panel title="Alpha/Beta Analytics" className="min-w-0">
          {analytics.data ? (
            <>
              <div className="h-[310px] min-h-[310px] min-w-0">
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
                      content={({ active: tooltipActive, payload }) => {
                        if (!tooltipActive || !payload?.length) return null;
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
                    <Scatter name="Assets" data={analytics.data.alpha_beta} fill="#A78BFA" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                {analytics.data.alpha_beta.map((item) => (
                  <div key={item.ticker} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="font-semibold text-white">{item.ticker}</div>
                    <div className="mt-1 text-base-200/70">{item.interpretation}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-base-200/70">Loading alpha/beta analytics...</div>
          )}
        </Panel>
      </div>

      <Panel title="Monte Carlo Simulation" className="min-w-0">
        {analytics.data ? (
          <div className="h-[340px] min-h-[340px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.data.monte_carlo}>
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
        ) : (
          <div className="text-sm text-base-200/70">Loading Monte Carlo simulation...</div>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-1">
        <Panel title={`${active} Strategy Snapshot`} className="min-w-0">
          {strategies.error ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{strategies.error}</div>
          ) : (
            <>
              <div className="h-[260px] min-h-[260px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strategyRows}>
                    <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 11 }} />
                    <YAxis stroke="rgba(255,255,255,0.45)" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.86)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="sharpe" name="Sharpe" fill="#A78BFA" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                {(strategies.data?.results ?? []).map((result) => (
                  <div key={result.strategy} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="font-semibold text-white">{result.strategy.replaceAll("_", " ")}</div>
                    <div className="mt-1 text-base-200/70">
                      Return {pct(result.metrics.total_return)} · Max DD {pct(result.metrics.max_drawdown)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
