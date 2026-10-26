import type { Locale } from "./config";

/** Latin digits in both languages (the UAE market convention). */
const numberLocale = (locale: Locale) => (locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE");

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export function formatNumber(value: number | string, locale: Locale): string {
  return new Intl.NumberFormat(numberLocale(locale)).format(Number(value));
}

export function formatPrice(value: number | string, locale: Locale): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

/** Picks `<field>_ar` / `<field>_en` for the locale, falling back to the other language. */
export function localized(item: object | null | undefined, field: string, locale: Locale): string {
  if (!item) return "";
  const record = item as Record<string, unknown>;
  const primary = record[`${field}_${locale}`];
  const other = record[`${field}_${locale === "ar" ? "en" : "ar"}`];
  return String(primary || other || "");
}
