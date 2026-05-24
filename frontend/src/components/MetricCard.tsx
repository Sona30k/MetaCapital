type Props = {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "good" | "bad" | "neutral";
};

export function MetricCard({ label, value, sublabel, tone = "neutral" }: Props) {
  return (
    <section className={`panel metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sublabel ? <small>{sublabel}</small> : null}
    </section>
  );
}
