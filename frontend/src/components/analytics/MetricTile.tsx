import { Badge } from "../ui/Badge";

export function MetricTile({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "success" | "danger" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-base-200/60">{label}</div>
        <Badge tone={tone}>{tone}</Badge>
      </div>
      <div className="font-mono text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-base-200/70">{detail}</div>
    </div>
  );
}
