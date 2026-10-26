"use client";

import { useI18n } from "../../../i18n/I18nProvider";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

const RADIUS = 15.9155; // circumference = 100, so dash lengths are percentages

export default function DonutChart({ slices, label }: { slices: DonutSlice[]; label: string }) {
  const { t, number } = useI18n();
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  const arcs = slices
    .filter((slice) => slice.value > 0)
    .reduce<Array<DonutSlice & { length: number; offset: number }>>((list, slice) => {
      const previous = list[list.length - 1];
      list.push({ ...slice, length: (slice.value / total) * 100, offset: previous ? previous.offset + previous.length : 0 });
      return list;
    }, []);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 42 42" role="img" aria-label={`${label}: ${number(total)}`} className="h-full w-full -rotate-90">
          <circle cx="21" cy="21" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx="21"
              cy="21"
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth="5"
              strokeDasharray={`${Math.max(arc.length - 0.6, 0.1)} ${100 - Math.max(arc.length - 0.6, 0.1)}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-3xl font-bold text-brand-ivory">{number(total)}</span>
          <span className="text-[11px] text-brand-muted">{t("Total")}</span>
        </div>
      </div>

      <ul className="min-w-[10rem] flex-1 space-y-2.5">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-brand-sand">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: slice.color }} aria-hidden="true" />
              {slice.label}
            </span>
            <span className="font-bold text-brand-ivory">
              {number(slice.value)}
              <span className="ms-1.5 text-xs font-normal text-brand-muted">{total ? `${number(Math.round((slice.value / total) * 100))}%` : "0%"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
