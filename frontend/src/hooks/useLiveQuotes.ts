import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, fetchQuotes } from "../lib/api";
import type { Quote } from "../lib/api";

type LiveQuoteState = {
  quotes: Quote[];
  loading: boolean;
  error: string | null;
  connected: boolean;
};

function wsUrl(tickers: string[]) {
  const base = API_BASE_URL.replace(/^http/, "ws");
  return `${base}/quotes/ws?tickers=${encodeURIComponent(tickers.join(","))}`;
}

export function useLiveQuotes(tickers: string[]): LiveQuoteState {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const key = useMemo(() => tickers.join(","), [tickers]);

  useEffect(() => {
    let active = true;

    fetchQuotes(tickers)
      .then((initial) => {
        if (active) setQuotes(initial);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load quotes");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const socket = new WebSocket(wsUrl(tickers));
    socket.onopen = () => active && setConnected(true);
    socket.onerror = () => active && setError("Live quote stream unavailable");
    socket.onclose = () => active && setConnected(false);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { quotes: Quote[] };
        if (active) setQuotes(payload.quotes);
      } catch {
        if (active) setError("Malformed quote update");
      }
    };

    return () => {
      active = false;
      socket.close();
    };
  }, [key]);

  return { quotes, loading, error, connected };
}
