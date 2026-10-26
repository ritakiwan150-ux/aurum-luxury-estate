"use client";

import { usePathname, useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { LOCALE_COOKIE, localeNames, type Locale } from "../../i18n/config";
import { useI18n } from "../../i18n/I18nProvider";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, dict } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const target: Locale = lang === "ar" ? "en" : "ar";

  const switchLanguage = () => {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
    const rest = pathname.replace(/^\/(ar|en)(?=\/|$)/, "");
    router.push(`/${target}${rest}${window.location.search}`);
  };

  return (
    <button
      type="button"
      onClick={switchLanguage}
      lang={target}
      aria-label={`${dict.nav.language}: ${localeNames[target]}`}
      className={`inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-brand-sand transition hover:border-brand-gold/60 hover:text-brand-gold ${className}`}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span>{localeNames[target]}</span>
    </button>
  );
}
