import { Fragment, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "../components/MetricCard";
import { Status } from "../components/Status";
import { compareStrategies } from "../lib/api";
import type { BacktestResult, StrategyName } from "../lib/api";

const strategies: StrategyName[] = ["buy_hold", "ma_crossover", "rsi_mean_reversion", "vol_breakout"];

const strategyNames: Record<StrategyName, string> = {
  buy_hold: "Buy & hold",
  ma_crossover: "MA crossover",
  rsi_mean_reversion: "RSI mean reversion",
  vol_breakout: "Volatility breakout",
};

const colors = ["#46d3a8", "#7aa2ff", "#f7c948", "#ff7a90"];

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function Strategies() {
  const [ticker, setTicker] = useState("AAPL");
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [selected, setSelected] = useState<StrategyName[]>(strategies);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh(nextTicker = ticker, nextSelected = selected) {
    setLoading(true);
    setError(null);
    try {
      setResults(await compareStrategies(nextTicker, nextSelected));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backtest failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh("AAPL", strategies);
  }, []);

  const mergedCurve = useMemo(() => {
    const byDate: Record<string, Record<string, number | string>> = {};
    for (const result of results) {
      for (const point of result.equity_curve) {
        const date = new Date(point.ts).toLocaleDateString();
        byDate[date] = byDate[date] ?? { date };
        byDate[date][result.strategy] = Number(point.equity.toFixed(2));
      }
    }
    return Object.values(byDate);
  }, [results]);

  const best = useMemo(
    () => [...results].sort((a, b) => b.metrics.sharpe - a.metrics.sharpe)[0],
    [results],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    refresh(ticker.toUpperCase().trim() || "AAPL", selected);
  }

  function toggle(strategy: StrategyName) {
    const next = selected.includes(strategy)
      ? selected.filter((item) => item !== strategy)
      : [...selected, strategy];
    setSelected(next);
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Backtesting engine</span>
          <h1>Strategy comparison dashboard</h1>
        </div>
        <form className="ticker-form" onSubmit={submit}>
          <input value={ticker} onChange={(event) => setTicker(event.target.value.toUpperCase())} />
          <button type="submit" disabled={!selected.length}>Run</button>
        </form>
      </header>

      <div className="segmented">
        {strategies.map((strategy) => (
          <button
            className={selected.includes(strategy) ? "active" : ""}
            key={strategy}
            onClick={() => toggle(strategy)}
            type="button"
          >
            {strategyNames[strategy]}
          </button>
        ))}
      </div>

      <Status loading={loading} error={error} label="Running historical backtests" />

      {best ? (
        <section className="metric-grid">
          <MetricCard label="Best strategy" value={strategyNames[best.strategy]} sublabel={`Sharpe ${best.metrics.sharpe.toFixed(2)}`} tone="good" />
          <MetricCard label="Total return" value={pct(best.metrics.total_return)} sublabel={best.ticker} tone={best.metrics.total_return >= 0 ? "good" : "bad"} />
          <MetricCard label="Max drawdown" value={pct(best.metrics.max_drawdown)} sublabel="worst peak-to-trough" tone="bad" />
          <MetricCard label="Trades" value={String(best.metrics.trades)} sublabel="estimated fills" />
        </section>
      ) : null}

      <section className="panel chart-panel">
        <div className="panel-heading">
          <h2>Equity curves</h2>
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={mergedCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#253047" />
            <XAxis dataKey="date" minTickGap={30} stroke="#8ea0bd" />
            <YAxis stroke="#8ea0bd" />
            <Tooltip contentStyle={{ background: "#101827", border: "1px solid #28344f" }} />
            <Legend />
            {results.map((result, index) => (
              <Area
                dataKey={result.strategy}
                fill={colors[index % colors.length]}
                fillOpacity={0.1}
                key={result.strategy}
                name={strategyNames[result.strategy]}
                stroke={colors[index % colors.length]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section className="strategy-table panel">
        <div className="panel-heading">
          <h2>Risk-adjusted metrics</h2>
        </div>
        <div className="table-grid">
          <strong>Strategy</strong>
          <strong>CAGR</strong>
          <strong>Sharpe</strong>
          <strong>Sortino</strong>
          <strong>Win rate</strong>
          {results.map((result) => (
            <Fragment key={result.strategy}>
              <span>{strategyNames[result.strategy]}</span>
              <span>{pct(result.metrics.cagr)}</span>
              <span>{result.metrics.sharpe.toFixed(2)}</span>
              <span>{result.metrics.sortino.toFixed(2)}</span>
              <span>{pct(result.metrics.win_rate)}</span>
            </Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Strategies;
