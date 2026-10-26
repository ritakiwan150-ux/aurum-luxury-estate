"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { dirOf, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";
import dashAr from "./dash-ar";
import { formatNumber, formatPrice, interpolate, localized } from "./format";

const warned = new Set<string>();

interface I18nContextValue {
  lang: Locale;
  dir: "rtl" | "ltr";
  dict: Dictionary;
  /** Prefixes a path with the active locale: href("/properties") -> "/ar/properties". */
  href: (path?: string) => string;
  price: (value: number | string) => string;
  number: (value: number | string) => string;
  text: (template: string, values: Record<string, string | number>) => string;
  /** Dashboard strings: English keys, translated to Arabic when the language is Arabic. */
  t: (key: string, values?: Record<string, string | number>) => string;
  pick: (item: object | null | undefined, field: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ lang, dict, children }: { lang: Locale; dict: Dictionary; children: ReactNode }) {
  const href = useCallback((path = "") => `/${lang}${path === "/" ? "" : path}`, [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      dir: dirOf(lang),
      dict,
      href,
      price: (amount) => formatPrice(amount, lang),
      number: (amount) => formatNumber(amount, lang),
      text: interpolate,
      t: (key, values) => {
        let base = key;
        if (lang === "ar") {
          if (dashAr[key] !== undefined) base = dashAr[key];
          else if (process.env.NODE_ENV !== "production" && !warned.has(key)) {
            warned.add(key);
            console.warn(`[i18n] Missing Arabic translation: "${key}"`);
          }
        }
        return values ? interpolate(base, values) : base;
      },
      pick: (item, field) => localized(item, field, lang),
    }),
    [lang, dict, href],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>.");
  return context;
}
