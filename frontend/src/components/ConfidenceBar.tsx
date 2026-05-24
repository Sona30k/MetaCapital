type Props = {
  value: number;
  label?: string;
};

export function ConfidenceBar({ value, label = "Confidence" }: Props) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);

  return (
    <div className="confidence">
      <div className="confidence-label">
        <span>{label}</span>
        <strong>{pct}%</strong>
      </div>
      <div className="confidence-track">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
