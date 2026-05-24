import { useState } from "react";
import { Panel } from "../components/ui/Panel";
import { Input } from "../components/ui/Input";
import { NewsPanel } from "../components/terminal/NewsPanel";
import { DebatePanel } from "../components/terminal/DebatePanel";

export default function NewsSentiment() {
  const [ticker, setTicker] = useState("AAPL");

  return (
    <div className="space-y-4">
      <Panel title="News & Sentiment" right={<Input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} className="w-28" />}>
        <div className="text-sm text-base-200/70">
          Pulls recent financial news and applies a lightweight sentiment scorer (VADER when available; otherwise a
          fallback lexicon).
        </div>
      </Panel>

      <NewsPanel ticker={ticker} />
      <DebatePanel ticker={ticker} />
    </div>
  );
}
