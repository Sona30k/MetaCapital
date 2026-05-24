import { useEffect, useMemo, useRef, useState } from "react";
import { WS_BASE_URL } from "../api/config";
import type { Quote } from "../api/types";

export type QuotesWsState = {
  status: "connecting" | "open" | "closed" | "error";
  error: string | null;
  quotes: Record<string, Quote>;
  series: Record<string, Array<{ ts: number; price: number }>>;
};

export function useQuotesWs(tickers: string[]) {
  const tickersKey = useMemo(() => tickers.map((t) => t.toUpperCase()).sort().join(","), [tickers]);
  const [state, setState] = useState<QuotesWsState>({
    status: "connecting",
    error: null,
    quotes: {},
    series: {},
  });

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = `${WS_BASE_URL}/quotes/ws?tickers=${encodeURIComponent(tickersKey)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    setState((s) => ({ ...s, status: "connecting", error: null }));

    ws.onopen = () => setState((s) => ({ ...s, status: "open" }));
    ws.onerror = () => setState((s) => ({ ...s, status: "error", error: "WebSocket error" }));
    ws.onclose = () => setState((s) => ({ ...s, status: "closed" }));

    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data) as { quotes: Quote[] };
        const nextQuotes: Record<string, Quote> = {};
        const now = Date.now();

        for (const q of payload.quotes ?? []) nextQuotes[q.ticker] = q;

        setState((prev) => {
          const nextSeries = { ...prev.series };
          for (const [ticker, q] of Object.entries(nextQuotes)) {
            const arr = (nextSeries[ticker] ?? []).slice(-119);
            arr.push({ ts: now, price: q.price });
            nextSeries[ticker] = arr;
          }
          return { ...prev, quotes: { ...prev.quotes, ...nextQuotes }, series: nextSeries };
        });
      } catch {
        // ignore bad payloads
      }
    };

    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  }, [tickersKey]);

  return state;
}
