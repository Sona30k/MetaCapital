import pandas as pd
import random
from ml_model import models, data_store

def agent_ml(ticker):
    df = data_store[ticker]
    model = models[ticker]

    latest = df.iloc[-1]

    input_data = pd.DataFrame([{
        "Close": float(latest["Close"]),
        "MA_5": float(latest["MA_5"]),
        "MA_10": float(latest["MA_10"]),
        "Return": float(latest["Return"]),
        "Volatility": float(latest["Volatility"])
    }])

    pred = model.predict(input_data)[0]

    return "BUY" if pred == 1 else "SELL"


def agent_random(ticker):
    return random.choice(["BUY", "SELL", "HOLD"])


# 🔥 THIS WAS MISSING (IMPORTANT)
agents = {
    "ml": agent_ml,
    "random": agent_random
}