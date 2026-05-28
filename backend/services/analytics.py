from __future__ import annotations

from dataclasses import dataclass
from datetime import timezone

import numpy as np
import pandas as pd
import yfinance as yf

from backend.models.schemas import (
    AlphaBetaPoint,
    AnalyticsResponse,
    CorrelationCell,
    MonteCarloPoint,
    PortfolioRiskMetrics,
    TimeRange,
)


TRADING_DAYS = 252
RISK_FREE_RATE = 0.04
RANGE_TO_DAYS: dict[TimeRange, int] = {"1M": 23, "3M": 63, "1Y": 252}
RANGE_TO_YF_PERIOD: dict[TimeRange, str] = {"1M": "1mo", "3M": "3mo", "1Y": "1y"}


def _clean_tickers(tickers: list[str]) -> list[str]:
    out = []
    for ticker in tickers:
        value = ticker.upper().strip()
        if value and value not in out:
            out.append(value)
    return out or ["AAPL", "MSFT", "GOOGL", "TSLA"]


def _synthetic_prices(tickers: list[str], periods: int) -> pd.DataFrame:
    dates = pd.date_range(end=pd.Timestamp.now(tz=timezone.utc), periods=periods, freq="B")
    market_seed = sum(sum(ord(c) for c in ticker) for ticker in tickers)
    rng_market = np.random.default_rng(market_seed)
    market_factor = rng_market.normal(loc=0.00035, scale=0.011, size=periods)

    data: dict[str, np.ndarray] = {}
    for ticker in tickers:
      seed = sum(ord(c) for c in ticker)
      rng = np.random.default_rng(seed)
      beta_like = 0.75 + (seed % 75) / 100
      idiosyncratic = rng.normal(loc=0.00015, scale=0.012, size=periods)
      returns = beta_like * market_factor + idiosyncratic
      data[ticker] = 100.0 * np.exp(np.cumsum(returns))

    return pd.DataFrame(data, index=dates)


def _download_prices(tickers: list[str], time_range: TimeRange) -> pd.DataFrame:
    periods = RANGE_TO_DAYS[time_range]
    try:
        raw = yf.download(
            tickers,
            period=RANGE_TO_YF_PERIOD[time_range],
            interval="1d",
            auto_adjust=True,
            progress=False,
        )
    except Exception:
        raw = None

    if raw is None or raw.empty:
        return _synthetic_prices(tickers, periods)

    if isinstance(raw.columns, pd.MultiIndex):
        if "Close" not in raw.columns.get_level_values(0):
            return _synthetic_prices(tickers, periods)
        close = raw["Close"]
    else:
        if "Close" not in raw:
            return _synthetic_prices(tickers, periods)
        close = raw[["Close"]].rename(columns={"Close": tickers[0]})

    close = close.reindex(columns=tickers).ffill().bfill().dropna(how="all")
    if len(close) < max(15, min(periods // 2, periods)):
        return _synthetic_prices(tickers, periods)

    return close.tail(periods)


def _max_drawdown(equity: pd.Series) -> float:
    running_max = equity.cummax()
    drawdown = (equity / running_max) - 1.0
    return float(drawdown.min())


def _interpret_alpha_beta(beta: float, alpha: float, sharpe: float) -> str:
    if beta >= 1.2 and alpha > 0:
        return "Aggressive asset with positive excess return."
    if beta >= 1.2:
        return "High beta asset; expect larger market swings."
    if beta <= 0.8 and sharpe > 0.7:
        return "Defensive stock with good risk-adjusted return."
    if beta <= 0.8:
        return "Defensive stock; lower market sensitivity."
    if sharpe > 1.0:
        return "Good risk-adjusted return."
    return "Balanced market exposure."


def _correlation_interpretation(corr: pd.DataFrame) -> str:
    values = corr.where(~np.eye(len(corr), dtype=bool)).stack()
    if values.empty:
        return "Not enough assets to compare relationships."

    avg = float(values.mean())
    strongest = values.abs().idxmax()
    strongest_value = float(values.loc[strongest])

    if avg > 0.65:
        tone = "The portfolio is highly connected, so diversification may be limited."
    elif avg < 0.25:
        tone = "The assets are weakly related, which supports diversification."
    else:
        tone = "The portfolio has a moderate relationship profile."

    return f"{tone} Strongest pair: {strongest[0]} / {strongest[1]} at {strongest_value:.2f}."


@dataclass
class AnalyticsService:
    def overview(
        self,
        tickers: list[str],
        benchmark: str = "SPY",
        time_range: TimeRange = "1Y",
    ) -> AnalyticsResponse:
        assets = _clean_tickers(tickers)
        benchmark = benchmark.upper().strip() or "SPY"
        all_tickers = assets + ([] if benchmark in assets else [benchmark])

        prices = _download_prices(all_tickers, time_range)
        returns = prices.pct_change().dropna()
        asset_returns = returns[assets]
        market_returns = returns[benchmark] if benchmark in returns else asset_returns.mean(axis=1)

        corr = asset_returns.corr(method="pearson").fillna(0.0)
        correlation = [
            CorrelationCell(x=row, y=col, value=float(corr.loc[row, col]))
            for row in assets
            for col in assets
        ]

        market_var = float(market_returns.var()) or 1e-9
        market_annual_return = float(market_returns.mean() * TRADING_DAYS)
        alpha_beta: list[AlphaBetaPoint] = []

        for ticker in assets:
            r = asset_returns[ticker].dropna()
            aligned = pd.concat([r, market_returns], axis=1).dropna()
            cov = float(aligned.iloc[:, 0].cov(aligned.iloc[:, 1])) if not aligned.empty else 0.0
            beta = cov / market_var
            annual_return = float(r.mean() * TRADING_DAYS)
            volatility = float(r.std() * np.sqrt(TRADING_DAYS))
            alpha = annual_return - (RISK_FREE_RATE + beta * (market_annual_return - RISK_FREE_RATE))
            sharpe = float((annual_return - RISK_FREE_RATE) / (volatility + 1e-9))
            alpha_beta.append(
                AlphaBetaPoint(
                    ticker=ticker,
                    annual_return=annual_return,
                    volatility=volatility,
                    beta=beta,
                    alpha=alpha,
                    sharpe=sharpe,
                    interpretation=_interpret_alpha_beta(beta, alpha, sharpe),
                )
            )

        weights = np.repeat(1 / len(assets), len(assets))
        portfolio_returns = asset_returns.dot(weights)
        portfolio_equity = (1 + portfolio_returns).cumprod()
        portfolio_vol = float(portfolio_returns.std() * np.sqrt(TRADING_DAYS))
        max_drawdown = _max_drawdown(portfolio_equity)

        off_diag = corr.where(~np.eye(len(corr), dtype=bool)).stack().abs()
        avg_abs_corr = float(off_diag.mean()) if not off_diag.empty else 1.0
        diversification_score = float(np.clip((1.0 - avg_abs_corr) * 100, 0, 100))
        risk_interpretation = (
            "Strong diversification with controlled volatility."
            if diversification_score >= 65 and portfolio_vol < 0.3
            else "Risk is concentrated; consider lower-correlation assets."
            if diversification_score < 40
            else "Moderate diversification with watchable drawdown risk."
        )

        monte_carlo = self._monte_carlo(portfolio_returns)

        return AnalyticsResponse(
            tickers=assets,
            benchmark=benchmark,
            time_range=time_range,
            correlation=correlation,
            correlation_interpretation=_correlation_interpretation(corr),
            alpha_beta=alpha_beta,
            portfolio_risk=PortfolioRiskMetrics(
                volatility=portfolio_vol,
                diversification_score=diversification_score,
                max_drawdown=max_drawdown,
                interpretation=risk_interpretation,
            ),
            monte_carlo=monte_carlo,
        )

    def _monte_carlo(self, returns: pd.Series, paths: int = 250, horizon: int = 60) -> list[MonteCarloPoint]:
        mu = float(returns.mean())
        sigma = float(returns.std()) or 0.001
        rng = np.random.default_rng(42)
        simulated = rng.normal(loc=mu, scale=sigma, size=(paths, horizon))
        equity = 100.0 * np.cumprod(1 + simulated, axis=1)
        bands = np.percentile(equity, [10, 50, 90], axis=0)
        return [
            MonteCarloPoint(day=i + 1, p10=float(bands[0, i]), p50=float(bands[1, i]), p90=float(bands[2, i]))
            for i in range(horizon)
        ]


analytics_service = AnalyticsService()
