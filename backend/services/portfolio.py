from __future__ import annotations

from dataclasses import dataclass, field

from backend.models.schemas import PlaceOrderRequest, PortfolioSnapshot, Position, PortfolioAccount
from backend.services.market_data import market_data


@dataclass
class _Position:
    qty: float = 0.0
    avg_price: float = 0.0


@dataclass
class _Account:
    cash: float = 10_000.0
    positions: dict[str, _Position] = field(default_factory=dict)


class InMemoryPortfolioStore:
    def __init__(self) -> None:
        self._accounts: dict[str, _Account] = {}

    def _get(self, session_id: str) -> _Account:
        if session_id not in self._accounts:
            self._accounts[session_id] = _Account()
        return self._accounts[session_id]

    def reset(self, session_id: str, cash: float = 10_000.0) -> None:
        self._accounts[session_id] = _Account(cash=cash)

    def place_order(self, session_id: str, req: PlaceOrderRequest) -> PortfolioSnapshot:
        acct = self._get(session_id)
        ticker = req.ticker.upper().strip()
        quote = market_data.get_quote(ticker)
        px = quote.price

        pos = acct.positions.get(ticker, _Position())

        if req.side == "BUY":
            cost = req.qty * px
            if cost > acct.cash:
                raise ValueError("Insufficient cash")

            new_qty = pos.qty + req.qty
            new_avg = ((pos.avg_price * pos.qty) + (px * req.qty)) / max(new_qty, 1e-9)
            pos.qty = new_qty
            pos.avg_price = new_avg
            acct.cash -= cost

        elif req.side == "SELL":
            if req.qty > pos.qty:
                raise ValueError("Insufficient shares")
            pos.qty -= req.qty
            acct.cash += req.qty * px
            # If fully closed, reset avg_price.
            if pos.qty <= 1e-9:
                pos = _Position()

        acct.positions[ticker] = pos
        return self.snapshot(session_id)

    def snapshot(self, session_id: str) -> PortfolioSnapshot:
        acct = self._get(session_id)
        positions: list[Position] = []

        equity_positions = 0.0
        pnl_total = 0.0
        for ticker, p in acct.positions.items():
            if p.qty <= 1e-9:
                continue
            q = market_data.get_quote(ticker)
            mkt = q.price
            pnl = (mkt - p.avg_price) * p.qty
            pnl_total += pnl
            equity_positions += mkt * p.qty
            positions.append(
                Position(
                    ticker=ticker,
                    qty=float(p.qty),
                    avg_price=float(p.avg_price),
                    market_price=float(mkt),
                    pnl=float(pnl),
                )
            )

        equity = acct.cash + equity_positions
        return PortfolioSnapshot(
            account=PortfolioAccount(cash=float(acct.cash), equity=float(equity), pnl=float(pnl_total)),
            positions=positions,
        )


portfolio_store = InMemoryPortfolioStore()
