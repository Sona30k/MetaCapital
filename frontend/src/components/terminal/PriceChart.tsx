import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Panel } from "../ui/Panel";

export function PriceChart({
  ticker,
  points,
}: {
  ticker: string;
  points: Array<{ ts: number; price: number }>;
}) {
  const data = points.map((p) => ({ t: p.ts, price: p.price }));

  return (
    <Panel title={`${ticker} · Live price`} className="h-[320px]">
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="t"
              tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              stroke="rgba(255,255,255,0.35)"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
            />
            <YAxis
              domain={["auto", "auto"]}
              stroke="rgba(255,255,255,0.35)"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(0,0,0,0.85)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
              }}
              labelFormatter={(v) =>
                new Date(Number(v)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
              }
            />
            <Line type="monotone" dataKey="price" stroke="#A78BFA" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-base-200/60">
        Streaming via FastAPI WebSocket. Under the hood we refresh from the provider periodically and emit micro-ticks in
        between for responsiveness.
      </div>
    </Panel>
  );
}

