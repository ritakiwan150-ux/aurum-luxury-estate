"use client";

import { useId, useState } from "react";
import type { AnalyticsPoint } from "../../../lib/api";
import { useI18n } from "../../../i18n/I18nProvider";

interface LineChartProps {
  data: AnalyticsPoint[];
  /** Accessible description, also used for the hidden data table. */
  label: string;
  color?: string;
}

const W = 640;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 30, left: 34 };

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / step) * step;
}

/** Dependency-free area/line chart. Always drawn left-to-right (time axis), labels follow the page language. */
export default function LineChart({ data, label, color = "#D4AF37" }: LineChartProps) {
  const { lang, t, number } = useI18n();
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const max = niceMax(Math.max(0, ...data.map((point) => point.count)));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (data.length <= 1 ? 0 : (index / (data.length - 1)) * innerW);
  const y = (value: number) => PAD.top + innerH - (value / max) * innerH;

  const line = data.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.count).toFixed(1)}`).join(" ");
  const area = data.length ? `${line} L${x(data.length - 1).toFixed(1)},${PAD.top + innerH} L${x(0).toFixed(1)},${PAD.top + innerH} Z` : "";

  const formatter = new Intl.DateTimeFormat(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "short" });
  const dateLabel = (iso: string) => formatter.format(new Date(`${iso}T00:00:00`));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round(max * fraction));
  const labelIndexes = data.length ? [0, Math.floor((data.length - 1) / 2), data.length - 1] : [];
  const total = data.reduce((sum, point) => sum + point.count, 0);
  const active = hover !== null ? data[hover] : null;

  return (
    <figure className="m-0" dir="ltr">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${number(total)}`} className="h-auto w-full" onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="rgba(255,255,255,0.08)" />
              <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="#B8AE98">{number(tick)}</text>
            </g>
          ))}

          {area && <path d={area} fill={`url(#${gradientId})`} />}
          {line && <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

          {labelIndexes.map((index) => (
            <text key={index} x={x(index)} y={H - 8} textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"} fontSize="11" fill="#B8AE98">
              {dateLabel(data[index].date)}
            </text>
          ))}

          {active && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke={color} strokeOpacity="0.5" strokeDasharray="4 4" />
              <circle cx={x(hover)} cy={y(active.count)} r="5" fill={color} stroke="#0B111E" strokeWidth="2" />
            </g>
          )}

          {data.map((point, index) => (
            <rect
              key={point.date}
              x={x(index) - innerW / data.length / 2}
              y={PAD.top}
              width={innerW / data.length}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(index)}
              onTouchStart={() => setHover(index)}
            />
          ))}
        </svg>

        {active && hover !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 rounded-md border border-brand-gold/30 bg-brand-obsidian px-3 py-2 text-xs shadow-xl"
            style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%`, top: `${(y(active.count) / H) * 100 - 22}%` }}
          >
            <p className="font-bold text-brand-ivory">{number(active.count)}</p>
            <p className="text-brand-muted">{dateLabel(active.date)}</p>
          </div>
        )}
      </div>

      {/* Screen-reader equivalent of the chart. */}
      <figcaption className="sr-only">
        <table>
          <caption>{`${label} — ${t("Data table")}`}</caption>
          <tbody>
            {data.map((point) => (
              <tr key={point.date}>
                <th scope="row">{dateLabel(point.date)}</th>
                <td>{number(point.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
