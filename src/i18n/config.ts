export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

/** Used when the visitor's browser language is neither Arabic nor English. */
export const defaultLocale: Locale = "ar";

export const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
