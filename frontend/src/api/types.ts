export type TradeAction = "BUY" | "SELL" | "HOLD";

export type Quote = {
  ticker: string;
  price: number;
  ts: string;
};

export type DebateRequest = {
  ticker: string;
  question: string;
  agents?: Array<"ml" | "random" | "news_sentiment" | "risk" | "moderator">;
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
  ticker?: string | null;
  headline: string;
  source?: string | null;
  url?: string | null;
  published_at?: string | null;
  summary?: string | null;
  sentiment: number;
};

export type NewsResponse = {
  articles: NewsArticle[];
};

export type PortfolioSnapshot = {
  account: { cash: number; equity: number; pnl: number };
  positions: Array<{
    ticker: string;
    qty: number;
    avg_price: number;
    market_price: number;
    pnl: number;
  }>;
};

export type PlaceOrderRequest = {
  ticker: string;
  side: "BUY" | "SELL";
  qty: number;
};

export type BacktestMetrics = {
  cagr: number;
  sharpe: number;
  sortino: number;
  max_drawdown: number;
  win_rate: number;
  total_return: number;
  trades: number;
};

export type EquityPoint = { ts: string; equity: number };

export type BacktestResult = {
  ticker: string;
  strategy: "buy_hold" | "ma_crossover" | "rsi_mean_reversion" | "vol_breakout";
  metrics: BacktestMetrics;
  equity_curve: EquityPoint[];
};

export type CompareResponse = { results: BacktestResult[] };

