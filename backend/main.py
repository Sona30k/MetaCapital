from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import numpy as np

from config import TICKERS, INITIAL_CAPITAL, POSITION_SIZE, TRANSACTION_COST
from ml_model import train_all_models, get_price_series, data_store
from agents import agents

app = FastAPI()

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# STARTUP (Train Models)
# -----------------------------
train_all_models(TICKERS)

# -----------------------------
# METRICS
# -----------------------------
def calculate_metrics(returns):
    returns = np.array(returns)

    if len(returns) == 0:
        return {"sharpe": 0, "max_drawdown": 0}

    sharpe = returns.mean() / (returns.std() + 1e-6)

    cumulative = returns.cumsum()
    peak = np.maximum.accumulate(cumulative)
    drawdown = cumulative - peak

    return {
        "sharpe": float(sharpe),
        "max_drawdown": float(drawdown.min())
    }


def allocate(scores):
    values = np.array(list(scores.values()))
    weights = np.exp(values) / np.sum(np.exp(values))
    return dict(zip(scores.keys(), (weights * 1000)))


# -----------------------------
# SIMULATION ENDPOINT
# -----------------------------
@app.get("/simulate")
def simulate():
    portfolio = {}

    for ticker in TICKERS:
        prices = get_price_series(ticker)

        results = {}
        scores = {}

        for name, agent in agents.items():

            capital = INITIAL_CAPITAL
            position = 0
            entry_price = 0

            returns = []
            capital_history = [capital]

            for i in range(1, len(prices)):
                price = prices[i]
                signal = agent(ticker)

                # ENTRY
                if signal == "BUY" and position == 0:
                    position = 1
                    entry_price = price

                elif signal == "SELL" and position == 0:
                    position = -1
                    entry_price = price

                # EXIT
                elif position != 0:
                    pnl = (price - entry_price) * position
                    pnl *= capital * POSITION_SIZE
                    pnl -= capital * TRANSACTION_COST

                    capital += pnl
                    returns.append(pnl)
                    position = 0

                capital_history.append(capital)

            metrics = calculate_metrics(returns)

            results[name] = {
                "final_capital": capital,
                "capital_history": capital_history,
                "metrics": metrics
            }

            scores[name] = metrics["sharpe"]

        portfolio[ticker] = {
            "results": results,
            "scores": scores,
            "allocation": allocate(scores)
        }

    return portfolio


# -----------------------------
# INSIGHTS ENDPOINT
# -----------------------------
@app.get("/insights")
def insights():
    out = {}

    for ticker in TICKERS:
        latest = data_store[ticker].iloc[-1]

        out[ticker] = {
            "RSI": float(latest.get("RSI", 0)),
            "message": "AI signals active (ML + indicators)"
        }

    return out


# -----------------------------
# LIVE PRICE WEBSOCKET
# -----------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    while True:
        try:
            live_data = {}

            for ticker in TICKERS:
                prices = get_price_series(ticker)
                live_data[ticker] = prices[-1]

            await websocket.send_json(live_data)

            await asyncio.sleep(2)

        except:
            break