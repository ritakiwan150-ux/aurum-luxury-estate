"use client";

import { useI18n } from "../../../i18n/I18nProvider";

export interface BarItem {
  key: string | number;
  label: string;
  value: number;
  hint?: string;
}

export default function BarList({ items, color = "#D4AF37" }: { items: BarItem[]; color?: string }) {
  const { t, number } = useI18n();
  const max = Math.max(1, ...items.map((item) => item.value));

  if (!items.length) return <p className="py-6 text-center text-sm text-brand-muted">{t("No data yet")}</p>;

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-brand-sand">{item.label}</span>
            <span className="shrink-0 font-bold text-brand-ivory">
              {number(item.value)}
              {item.hint && <span className="ms-2 text-xs font-normal text-brand-muted">{item.hint}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10" role="presentation">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
