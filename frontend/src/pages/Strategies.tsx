import { useEffect, useState } from "react";
import axios from "axios";

type Metrics = {
    sharpe?: number;
    max_drawdown?: number;
};

type AgentResult = {
    final_capital?: number;
    metrics?: Metrics;
};

type StockData = {
    results?: {
        [agent: string]: AgentResult;
    };
    allocation?: {
        [agent: string]: number;
    };
};

type ApiResponse = {
    [ticker: string]: StockData;
};

function Strategies() {
    const [data, setData] = useState<ApiResponse | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get<ApiResponse>("http://127.0.0.1:8000/simulate");
            console.log("STRATEGY DATA:", res.data);
            setData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const descriptions: Record<string, string> = {
        ml: "AI model using technical indicators",
        momentum: "Trend-following strategy",
        mean_reversion: "Buys oversold / sells overbought",
        volatility: "Trades based on volatility spikes",
        ensemble: "Combines all strategies",
        random: "Baseline random strategy"
    };

    if (!data) return <h3>Loading...</h3>;

    return (
        <div>
            <h1>📊 Strategies</h1>

            {Object.keys(data).map((ticker) => {
                const stock = data[ticker];
                const results = stock?.results || {};
                const allocation = stock?.allocation || {};

                return (
                    <div key={ticker} style={{ marginBottom: "40px" }}>
                        <h2>{ticker}</h2>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                                gap: "20px",
                                marginTop: "20px"
                            }}
                        >
                            {Object.keys(results).map((agent) => {
                                const result = results[agent];

                                const sharpe = result?.metrics?.sharpe ?? 0;

                                let status = "Neutral";
                                let bg = "#444";

                                if (sharpe > 0.5) {
                                    status = "🟢 Strong";
                                    bg = "#065f46";
                                } else if (sharpe > 0) {
                                    status = "🟡 Moderate";
                                    bg = "#92400e";
                                } else {
                                    status = "🔴 Weak";
                                    bg = "#7f1d1d";
                                }

                                return (
                                    <div
                                        key={agent}
                                        style={{
                                            background: "black",
                                            padding: "20px",
                                            borderRadius: "10px",
                                            color: "white"
                                        }}
                                    >
                                        <h3>{agent}</h3>

                                        <p style={{ fontSize: "14px", opacity: 0.8 }}>
                                            {descriptions[agent] || "Strategy"}
                                        </p>

                                        <hr />

                                        {/* CAPITAL */}
                                        <p>
                                            💰 Capital: ₹{" "}
                                            {result?.final_capital !== undefined
                                                ? result.final_capital.toFixed(2)
                                                : "N/A"}
                                        </p>

                                        {/* METRICS */}
                                        <p>
                                            📈 Sharpe:{" "}
                                            {result?.metrics?.sharpe !== undefined
                                                ? result.metrics.sharpe.toFixed(2)
                                                : "N/A"}
                                        </p>

                                        <p>
                                            📉 Drawdown:{" "}
                                            {result?.metrics?.max_drawdown !== undefined
                                                ? result.metrics.max_drawdown.toFixed(2)
                                                : "N/A"}
                                        </p>

                                        {/* ALLOCATION */}
                                        <p>
                                            ⚖️ Allocation: ₹{" "}
                                            {allocation[agent] !== undefined
                                                ? allocation[agent].toFixed(2)
                                                : "N/A"}
                                        </p>

                                        {/* STATUS */}
                                        <div
                                            style={{
                                                marginTop: "10px",
                                                padding: "6px",
                                                borderRadius: "8px",
                                                background: bg,
                                                textAlign: "center"
                                            }}
                                        >
                                            {status}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default Strategies;