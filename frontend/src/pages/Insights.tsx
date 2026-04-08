import { useEffect, useState } from "react";
import axios from "axios";

type InsightsData = {
    [ticker: string]: {
        RSI?: number;
        message?: string;
    };
};

type AgentScore = {
    [agent: string]: number;
};

type Allocation = {
    [agent: string]: number;
};

type StockData = {
    scores?: AgentScore;
    allocation?: Allocation;
};

type SimulateData = {
    [ticker: string]: StockData;
};

function Insights() {
    const [insights, setInsights] = useState<InsightsData | null>(null);
    const [data, setData] = useState<SimulateData | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res1 = await axios.get<InsightsData>("http://127.0.0.1:8000/insights");
            const res2 = await axios.get<SimulateData>("http://127.0.0.1:8000/simulate");

            console.log("INSIGHTS:", res1.data);
            console.log("SIMULATION:", res2.data);

            setInsights(res1.data);
            setData(res2.data);
        } catch (err) {
            console.error(err);
            alert("Error fetching insights");
        }
    };

    if (!insights || !data) return <h3>Loading insights...</h3>;

    return (
        <div>
            <h1 style={{ color: "#4A0F0F" }}>🧠 AI Insights</h1>

            {Object.keys(data).map((ticker) => {
                const stockInsights = insights[ticker];
                const stockData = data[ticker];

                const scores = stockData?.scores || {};
                const allocation = stockData?.allocation || {};

                // 🏆 Find best agent per stock
                const bestAgent = Object.keys(scores).reduce((a, b) =>
                    scores[a] > scores[b] ? a : b
                    , Object.keys(scores)[0]);

                return (
                    <div key={ticker} style={{ marginTop: "30px" }}>

                        <h2>{ticker}</h2>

                        {/* MARKET INSIGHT */}
                        <div style={{
                            background: "black",
                            padding: "20px",
                            borderRadius: "12px",
                            marginTop: "10px"
                        }}>
                            <h3>Market Analysis</h3>
                            <p>{stockInsights?.message || "No insight available"}</p>
                            <p><b>RSI:</b> {stockInsights?.RSI?.toFixed(2) ?? "N/A"}</p>
                        </div>

                        {/* BEST AGENT */}
                        <div style={{
                            background: "black",
                            padding: "20px",
                            borderRadius: "12px",
                            marginTop: "10px"
                        }}>
                            <h3>🏆 Best Strategy</h3>
                            <p><b>{bestAgent || "N/A"}</b></p>

                            <p>
                                Score:{" "}
                                {scores[bestAgent] !== undefined
                                    ? scores[bestAgent].toFixed(3)
                                    : "N/A"}
                            </p>

                            <p>
                                Allocation: ₹{" "}
                                {allocation[bestAgent] !== undefined
                                    ? allocation[bestAgent].toFixed(2)
                                    : "N/A"}
                            </p>
                        </div>

                        {/* RISK */}
                        <div style={{
                            background: "black",
                            padding: "20px",
                            borderRadius: "12px",
                            marginTop: "10px"
                        }}>
                            <h3>⚠️ Risk Insight</h3>
                            <p>
                                Market volatility may impact returns.
                                Diversification across strategies reduces risk.
                            </p>
                        </div>

                    </div>
                );
            })}
        </div>
    );
}

export default Insights;