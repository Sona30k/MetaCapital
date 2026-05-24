import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ConfidenceBar } from "../components/ConfidenceBar";
import { MetricCard } from "../components/MetricCard";
import { Status } from "../components/Status";
import {
  fetchNews,
  fetchPortfolio,
  placeOrder,
  runDebate,
} from "../lib/api";
import type { DebateResponse, NewsArticle, PortfolioSnapshot } from "../lib/api";

const defaultTicker = "AAPL";

function money(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function sentimentLabel(score: number) {
  if (score > 0.15) return "Positive";
  if (score < -0.15) return "Negative";
  return "Neutral";
}

function Dashboard() {
  const [ticker, setTicker] = useState(defaultTicker);
  const [debate, setDebate] = useState<DebateResponse | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot | null>(null);
  const [qty, setQty] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const avgSentiment = useMemo(() => {
    if (!news.length) return 0;
    return news.reduce((sum, item) => sum + item.sentiment, 0) / news.length;
  }, [news]);

  const agentChart = useMemo(
    () =>
      debate?.opinions.map((opinion) => ({
        agent: opinion.agent.replace("_", " "),
        confidence: Math.round(opinion.confidence * 100),
      })) ?? [],
    [debate],
  );

  const sentimentChart = news.map((article, index) => ({
    name: `N${index + 1}`,
    sentiment: Number(article.sentiment.toFixed(2)),
  }));

  async function refresh(nextTicker = ticker) {
    setLoading(true);
    setError(null);
    try {
      const [debateData, newsData, portfolioData] = await Promise.all([
        runDebate(nextTicker, `Should MetaCapital buy, sell, or hold ${nextTicker} this week?`),
        fetchNews(nextTicker),
        fetchPortfolio(),
      ]);
      setDebate(debateData);
      setNews(newsData);
      setPortfolio(portfolioData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(defaultTicker);
  }, []);

  async function submitTicker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    refresh(ticker.toUpperCase().trim() || defaultTicker);
  }

  async function trade(side: "BUY" | "SELL") {
    setError(null);
    try {
      const updated = await placeOrder(ticker, side, qty);
      setPortfolio(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order rejected");
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">AI command center</span>
          <h1>Multi-agent financial analysis</h1>
        </div>
        <form className="ticker-form" onSubmit={submitTicker}>
          <input value={ticker} onChange={(event) => setTicker(event.target.value.toUpperCase())} />
          <button type="submit">Analyze</button>
        </form>
      </header>

      <Status loading={loading} error={error} />

      {debate && portfolio ? (
        <>
          <section className="metric-grid">
            <MetricCard label="Agent decision" value={debate.final_action} sublabel={debate.ticker} tone={debate.final_action === "BUY" ? "good" : debate.final_action === "SELL" ? "bad" : "neutral"} />
            <MetricCard label="Portfolio equity" value={money(portfolio.account.equity)} sublabel={`${money(portfolio.account.pnl)} open P/L`} tone={portfolio.account.pnl >= 0 ? "good" : "bad"} />
            <MetricCard label="News sentiment" value={sentimentLabel(avgSentiment)} sublabel={avgSentiment.toFixed(2)} tone={avgSentiment >= 0 ? "good" : "bad"} />
            <MetricCard label="Cash available" value={money(portfolio.account.cash)} sublabel="fake-money simulator" />
          </section>

          <section className="dashboard-grid">
            <div className="panel debate-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">AI debate</span>
                  <h2>{debate.question}</h2>
                </div>
                <ConfidenceBar value={debate.confidence} />
              </div>

              <div className="agent-list">
                {debate.opinions.map((opinion) => (
                  <article className="agent-row" key={opinion.agent}>
                    <div>
                      <strong>{opinion.agent.replace("_", " ")}</strong>
                      <p>{opinion.rationale}</p>
                    </div>
                    <span className={`action ${opinion.action.toLowerCase()}`}>{opinion.action}</span>
                  </article>
                ))}
              </div>
            </div>

            <div className="panel chart-panel">
              <div className="panel-heading">
                <h2>Confidence scoring</h2>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={agentChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253047" />
                  <XAxis dataKey="agent" stroke="#8ea0bd" />
                  <YAxis stroke="#8ea0bd" />
                  <Tooltip contentStyle={{ background: "#101827", border: "1px solid #28344f" }} />
                  <Bar dataKey="confidence" fill="#46d3a8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="panel">
              <div className="panel-heading">
                <h2>Fake-money portfolio</h2>
              </div>
              <div className="trade-ticket">
                <input type="number" min="1" value={qty} onChange={(event) => setQty(Number(event.target.value))} />
                <button type="button" onClick={() => trade("BUY")}>Buy</button>
                <button type="button" className="danger" onClick={() => trade("SELL")}>Sell</button>
              </div>
              <div className="positions">
                {portfolio.positions.length ? (
                  portfolio.positions.map((position) => (
                    <div className="position-row" key={position.ticker}>
                      <strong>{position.ticker}</strong>
                      <span>{position.qty} shares</span>
                      <span>{money(position.pnl)}</span>
                    </div>
                  ))
                ) : (
                  <p className="muted">No open positions yet.</p>
                )}
              </div>
            </div>

            <div className="panel chart-panel">
              <div className="panel-heading">
                <h2>News sentiment feed</h2>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={sentimentChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253047" />
                  <XAxis dataKey="name" stroke="#8ea0bd" />
                  <YAxis domain={[-1, 1]} stroke="#8ea0bd" />
                  <Tooltip contentStyle={{ background: "#101827", border: "1px solid #28344f" }} />
                  <Area dataKey="sentiment" stroke="#7aa2ff" fill="#243b73" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="news-list">
                {news.slice(0, 4).map((article) => (
                  <a href={article.url ?? "#"} key={article.id} target="_blank" rel="noreferrer">
                    <span>{article.source ?? "market news"}</span>
                    {article.headline}
                  </a>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default Dashboard;
