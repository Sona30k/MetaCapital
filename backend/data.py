import yfinance as yf

def get_real_data():
    stocks = ["AAPL", "GOOG", "MSFT", "TSLA"]

    movements = []

    for stock in stocks:
        df = yf.download(stock, period="5d", interval="5m")  # REAL-TIME

        for i in range(1, len(df)):
            if df["Close"].iloc[i] > df["Close"].iloc[i-1]:
                movements.append("UP")
            else:
                movements.append("DOWN")

    return movements