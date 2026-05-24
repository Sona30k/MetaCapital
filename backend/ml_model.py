import pandas as pd
import yfinance as yf

try:
    from xgboost import XGBClassifier
except Exception:
    XGBClassifier = None  # type: ignore[assignment]

try:
    from sklearn.ensemble import RandomForestClassifier
except Exception:
    RandomForestClassifier = None  # type: ignore[assignment]

models = {}
data_store = {}

def train_single_stock(ticker):
    try:
        df = yf.download(ticker, period="6mo", interval="1d")
    except:
        return None, None

    if df is None or df.empty:
        return None, None

    # fix columns
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df.columns = df.columns.str.strip()

    # features
    df["MA_5"] = df["Close"].rolling(5).mean()
    df["MA_10"] = df["Close"].rolling(10).mean()
    df["Return"] = df["Close"].pct_change()
    df["Volatility"] = df["Close"].pct_change().rolling(5).std()

    # target
    df["Target"] = (df["Close"].shift(-1) > df["Close"]).astype(int)

    df = df.dropna()

    cols = ["Close", "MA_5", "MA_10", "Return", "Volatility"]

    df[cols] = df[cols].astype(float)
    df["Target"] = df["Target"].astype(int)

    X = df[cols]
    y = df["Target"]

    if XGBClassifier is not None:
        model = XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            eval_metric="logloss"
        )
    elif RandomForestClassifier is not None:
        model = RandomForestClassifier(n_estimators=120, max_depth=5, random_state=42)
    else:
        return None, df

    model.fit(X, y)

    return model, df


def train_all_models(tickers):
    for ticker in tickers:
        model, df = train_single_stock(ticker)
        if model is not None:
            models[ticker] = model
            data_store[ticker] = df


def get_price_series(ticker):
    try:
        df = yf.download(ticker, period="5d", interval="5m")
    except:
        return [100, 101, 102]

    if df is None or df.empty:
        return [100, 101, 102]

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df.columns = df.columns.str.strip()

    if "Close" not in df:
        return [100, 101, 102]

    close = df["Close"]

    if hasattr(close, "iloc") and len(close.shape) > 1:
        close = close.iloc[:, 0]

    return close.dropna().values.tolist()
