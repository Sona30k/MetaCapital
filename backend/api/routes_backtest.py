from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.backtesting.engine import backtest_engine
from backend.models.schemas import BacktestRequest, BacktestResult, CompareRequest, CompareResponse

router = APIRouter(prefix="/backtest", tags=["backtest"])


@router.post("/run", response_model=BacktestResult)
def run(req: BacktestRequest):
    try:
        return backtest_engine.run(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/compare", response_model=CompareResponse)
def compare(req: CompareRequest):
    try:
        results = []
        for s in req.strategies:
            params = req.params_by_strategy.get(s, {})
            results.append(
                backtest_engine.run(
                    BacktestRequest(
                        ticker=req.ticker,
                        strategy=s,
                        start=req.start,
                        end=req.end,
                        initial_cash=req.initial_cash,
                        params=params,
                    )
                )
            )
        return CompareResponse(results=results)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
