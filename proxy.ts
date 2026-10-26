import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, hasLocale, locales, type Locale } from "./src/i18n/config";

/** Picks the best supported language from the Accept-Language header. */
function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      return { base: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.split("=")[1]) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const match = ranked.find((entry) => hasLocale(entry.base));
  return match ? (match.base as Locale) : null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocalePrefix = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasLocalePrefix) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale =
    saved && hasLocale(saved) ? saved : fromAcceptLanguage(request.headers.get("accept-language")) ?? defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, the API proxy (if any), and files with an extension (images, fonts, sitemap...).
  matcher: ["/((?!_next|api|images|.*\\..*).*)"],
};
