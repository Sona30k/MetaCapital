import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ConfidenceBar } from "../components/ConfidenceBar";
import { Status } from "../components/Status";
import { fetchNews, runDebate } from "../lib/api";
import type { DebateResponse, NewsArticle } from "../lib/api";

function Insights() {
  const [ticker, setTicker] = useState("AAPL");
  const [debate, setDebate] = useState<DebateResponse | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh(nextTicker = ticker) {
    setLoading(true);
    setError(null);
    try {
      const [nextDebate, nextArticles] = await Promise.all([
        runDebate(nextTicker, `Explain the current ${nextTicker} signal and the evidence behind it.`),
        fetchNews(nextTicker),
      ]);
      setDebate(nextDebate);
      setArticles(nextArticles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load explainability panel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh("AAPL");
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    refresh(ticker.toUpperCase().trim() || "AAPL");
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Explainable AI</span>
          <h1>Reasoning logs and sentiment trace</h1>
        </div>
        <form className="ticker-form" onSubmit={submit}>
          <input value={ticker} onChange={(event) => setTicker(event.target.value.toUpperCase())} />
          <button type="submit">Explain</button>
        </form>
      </header>

      <Status loading={loading} error={error} />

      {debate ? (
        <section className="insight-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className={`action ${debate.final_action.toLowerCase()}`}>{debate.final_action}</span>
                <h2>Moderator decision</h2>
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

          <div className="panel">
            <div className="panel-heading">
              <h2>Reasoning log</h2>
            </div>
            <div className="timeline">
              {debate.reasoning.map((step, index) => (
                <article key={`${step.agent}-${index}`}>
                  <span>{new Date(step.ts).toLocaleTimeString()}</span>
                  <strong>{step.agent}: {step.title}</strong>
                  <pre>{JSON.stringify(step.data, null, 2)}</pre>
                </article>
              ))}
            </div>
          </div>

          <div className="panel news-panel">
            <div className="panel-heading">
              <h2>Financial news sentiment</h2>
            </div>
            {articles.map((article) => (
              <a className="news-card" href={article.url ?? "#"} key={article.id} target="_blank" rel="noreferrer">
                <span>{article.source ?? "market news"} / sentiment {article.sentiment.toFixed(2)}</span>
                <strong>{article.headline}</strong>
                {article.summary ? <p>{article.summary}</p> : null}
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default Insights;
