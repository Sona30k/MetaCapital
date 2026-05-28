import { Fragment, useMemo, useState } from "react";
import type { CorrelationCell } from "../../api/types";

function colorFor(value: number) {
  const strength = Math.min(Math.abs(value), 1);
  if (value >= 0) return `rgba(34, 197, 94, ${0.18 + strength * 0.72})`;
  return `rgba(239, 68, 68, ${0.18 + strength * 0.72})`;
}

export function CorrelationHeatmap({ cells, tickers }: { cells: CorrelationCell[]; tickers: string[] }) {
  const [active, setActive] = useState<CorrelationCell | null>(null);
  const map = useMemo(() => new Map(cells.map((cell) => [`${cell.x}:${cell.y}`, cell])), [cells]);

  return (
    <div className="space-y-3">
      <div
        className="grid gap-1 overflow-auto"
        style={{ gridTemplateColumns: `80px repeat(${tickers.length}, minmax(70px, 1fr))` }}
      >
        <div />
        {tickers.map((ticker) => (
          <div key={ticker} className="px-2 py-1 text-center text-xs font-semibold text-base-200/70">
            {ticker}
          </div>
        ))}
        {tickers.map((row) => (
          <Fragment key={row}>
            <div key={`${row}-label`} className="px-2 py-4 text-xs font-semibold text-base-200/70">
              {row}
            </div>
            {tickers.map((col) => {
              const cell = map.get(`${row}:${col}`) ?? { x: row, y: col, value: 0 };
              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  className="min-h-14 rounded-xl border border-white/10 font-mono text-sm text-white transition hover:scale-[1.02]"
                  style={{ background: colorFor(cell.value) }}
                  onMouseEnter={() => setActive(cell)}
                  onFocus={() => setActive(cell)}
                >
                  {cell.value.toFixed(2)}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-base-200/80">
        {active
          ? `${active.x} and ${active.y}: Pearson correlation ${active.value.toFixed(2)}`
          : "Hover a cell to inspect the relationship."}
      </div>
    </div>
  );
}
