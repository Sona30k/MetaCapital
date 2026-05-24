import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { NewsArticle, NewsResponse } from "../../api/types";
import { Badge } from "../ui/Badge";
import { Panel } from "../ui/Panel";

function tone(sentiment: number) {
  if (sentiment > 0.15) return "success";
  if (sentiment < -0.15) return "danger";
  return "warn";
}

export function NewsPanel({ ticker }: { ticker: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api
      .get<NewsResponse>("/news", { params: { ticker, limit: 12 } })
      .then((r) => {
        if (!mounted) return;
        setArticles(r.data.articles ?? []);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load news");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [ticker]);

  return (
    <Panel title="News sentiment">
      {loading ? (
        <div className="text-sm text-base-200/70">Loading news…</div>
      ) : error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
      ) : articles.length === 0 ? (
        <div className="text-sm text-base-200/70">No articles found.</div>
      ) : (
        <div className="space-y-2">
          {articles.map((a) => (
            <a
              key={a.id}
              href={a.url ?? "#"}
              target={a.url ? "_blank" : undefined}
              rel="noreferrer"
              className="block rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{a.headline}</div>
                  <div className="mt-1 text-xs text-base-200/60">
                    {a.source ?? "source"} · sentiment {a.sentiment.toFixed(2)}
                  </div>
                </div>
                <Badge tone={tone(a.sentiment) as any}>{tone(a.sentiment).toUpperCase()}</Badge>
              </div>
            </a>
          ))}
        </div>
      )}
    </Panel>
  );
}
