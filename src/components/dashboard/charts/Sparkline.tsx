import type { AnalyticsPoint } from "../../../lib/api";

/** Tiny decorative trend line for KPI cards. */
export default function Sparkline({ data, color = "#D4AF37" }: { data: AnalyticsPoint[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(1, ...data.map((point) => point.count));
  const points = data.map((point, index) => `${((index / (data.length - 1)) * 100).toFixed(1)},${(26 - (point.count / max) * 24).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true" className="h-8 w-full">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
