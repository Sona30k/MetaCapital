import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export type TradeAction = "BUY" | "SELL" | "HOLD";
export type StrategyName = "buy_hold" | "ma_crossover" | "rsi_mean_reversion" | "vol_breakout";

export type Quote = {
  ticker: string;
  price: number;
  ts: string;
};

export type AgentOpinion = {
  agent: string;
  action: TradeAction;
  confidence: number;
  rationale: string;
};

export type ReasoningStep = {
  ts: string;
  agent: string;
  title: string;
  data: Record<string, unknown>;
};

export type DebateResponse = {
  session_id: string;
  ticker: string;
  question: string;
  opinions: AgentOpinion[];
  final_action: TradeAction;
  confidence: number;
  reasoning: ReasoningStep[];
};

export type NewsArticle = {
  id: string;
  ticker?: string;
  headline: string;
  source?: string;
  url?: string;
  published_at?: string;
  summary?: string;
  sentiment: number;
};

export type PortfolioSnapshot = {
  account: {
    cash: number;
    equity: number;
    pnl: number;
  };
  positions: Array<{
    ticker: string;
    qty: number;
    avg_price: number;
    market_price: number;
    pnl: number;
  }>;
};

export type BacktestResult = {
  ticker: string;
  strategy: StrategyName;
  metrics: {
    cagr: number;
    sharpe: number;
    sortino: number;
    max_drawdown: number;
    win_rate: number;
    total_return: number;
    trades: number;
  };
  equity_curve: Array<{ ts: string; equity: number }>;
};

export async function fetchQuotes(tickers: string[]) {
  const { data } = await api.get<{ quotes: Quote[] }>("/quotes", { params: { tickers } });
  return data.quotes;
}

export async function runDebate(ticker: string, question: string) {
  const { data } = await api.post<DebateResponse>("/ai/debate", { ticker, question });
  return data;
}

export async function fetchNews(ticker: string) {
  const { data } = await api.get<{ articles: NewsArticle[] }>("/news", { params: { ticker, limit: 8 } });
  return data.articles;
}

export async function fetchPortfolio() {
  const { data } = await api.get<PortfolioSnapshot>("/portfolio/snapshot");
  return data;
}

export async function placeOrder(ticker: string, side: "BUY" | "SELL", qty: number) {
  const { data } = await api.post<PortfolioSnapshot>("/portfolio/orders", { ticker, side, qty });
  return data;
}

export async function resetPortfolio() {
  const { data } = await api.post<PortfolioSnapshot>("/portfolio/reset");
  return data;
}

export async function compareStrategies(ticker: string, strategies: StrategyName[]) {
  const { data } = await api.post<{ results: BacktestResult[] }>("/backtest/compare", {
    ticker,
    strategies,
    initial_cash: 10000,
  });
  return data.results;
}
