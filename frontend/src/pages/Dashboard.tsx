import { useEffect, useState } from "react";
import axios from "axios";

type Metrics = {
    sharpe?: number;
};

type AgentResult = {
    final_capital?: number;
    metrics?: Metrics;
};

type StockResult = {
    results?: {
        ml?: AgentResult;
        random?: AgentResult;
    };
};

type ApiResponse = {
    [ticker: string]: StockResult;
};

function Dashboard() {
    const [data, setData] = useState<ApiResponse | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get<ApiResponse>("http://127.0.0.1:8000/simulate");
            console.log("API DATA:", res.data); // 🔥 debug
            setData(res.data);
        } catch (err) {
            console.error("API ERROR:", err);
        }
    };

    if (!data) return <h2>Loading AI Data...</h2>;

    return (
        <div>
            <h1>📊 Dashboard</h1>

            {Object.keys(data).map((ticker) => {
                const stock = data[ticker];

                const ml = stock?.results?.ml;
                const random = stock?.results?.random;

                return (
                    <div
                        key={ticker}
                        style={{
                            background: "black",
                            padding: "20px",
                            marginBottom: "20px",
                            borderRadius: "10px",
                            color: "white",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
                        }}
                    >
                        <h2>{ticker}</h2>

                        {/* Capital */}
                        <p>
                            🤖 ML Capital: ₹
                            {ml?.final_capital !== undefined
                                ? ml.final_capital.toFixed(2)
                                : "N/A"}
                        </p>

                        <p>
                            🎲 Random Capital: ₹
                            {random?.final_capital !== undefined
                                ? random.final_capital.toFixed(2)
                                : "N/A"}
                        </p>

                        {/* Metrics */}
                        <p>
                            📈 ML Sharpe:{" "}
                            {ml?.metrics?.sharpe !== undefined
                                ? ml.metrics.sharpe.toFixed(4)
                                : "N/A"}
                        </p>

                        <p>
                            📉 Random Sharpe:{" "}
                            {random?.metrics?.sharpe !== undefined
                                ? random.metrics.sharpe.toFixed(4)
                                : "N/A"}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

export default Dashboard;