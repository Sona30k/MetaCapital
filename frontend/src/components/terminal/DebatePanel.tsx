import { useMemo, useState } from "react";
import { api } from "../../api/client";
import type { DebateResponse, TradeAction } from "../../api/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Panel } from "../ui/Panel";

function toneForAction(a: TradeAction) {
  if (a === "BUY") return "success";
  if (a === "SELL") return "danger";
  return "warn";
}

export function DebatePanel({ ticker }: { ticker: string }) {
  const defaultQ = useMemo(() => `Should we BUY, SELL, or HOLD ${ticker} for the next 2 weeks?`, [ticker]);
  const [question, setQuestion] = useState(defaultQ);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DebateResponse | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.post<DebateResponse>("/ai/debate", { ticker, question });
      setResult(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to run debate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel
      title="AI debate"
      right={
        result ? (
          <div className="flex items-center gap-2">
            <Badge tone={toneForAction(result.final_action) as any}>{result.final_action}</Badge>
            <span className="text-xs text-base-200/70">Confidence {Math.round(result.confidence * 100)}%</span>
          </div>
        ) : null
      }
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask the agents…" />
          <Button onClick={run} disabled={loading || !question.trim()}>
            {loading ? "Running…" : "Run"}
          </Button>
        </div>

        {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}

        {!result ? (
          <div className="text-sm text-base-200/70">
            This runs multiple agents (ML, news sentiment, risk overlay, baseline) and aggregates their weighted votes.
            The full reasoning log is shown below when available.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-base-200/70">Agent opinions</div>
              <div className="space-y-2">
                {result.opinions.map((op) => (
                  <div key={op.agent} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-white">{op.agent}</div>
                      <Badge tone={toneForAction(op.action) as any}>
                        {op.action} · {Math.round(op.confidence * 100)}%
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-base-200/80">{op.rationale}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-base-200/70">Explainability / reasoning log</div>
              <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                {result.reasoning.length === 0 ? (
                  <div className="text-sm text-base-200/70">No reasoning steps returned.</div>
                ) : (
                  result.reasoning.map((step, idx) => (
                    <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">{step.title}</div>
                        <div className="text-xs text-base-200/60">{step.agent}</div>
                      </div>
                      <pre className="mt-2 overflow-auto rounded-lg bg-black/40 p-2 text-xs text-base-200/80">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
