import type { Quote } from "../lib/api";

type Props = {
  quotes: Quote[];
  connected: boolean;
};

export function QuoteTape({ quotes, connected }: Props) {
  return (
    <div className="quote-tape" aria-label="Live stock quotes">
      <span className={connected ? "status-dot online" : "status-dot"} />
      {quotes.map((quote) => (
        <div className="quote-chip" key={quote.ticker}>
          <span>{quote.ticker}</span>
          <strong>${quote.price.toFixed(2)}</strong>
        </div>
      ))}
    </div>
  );
}
