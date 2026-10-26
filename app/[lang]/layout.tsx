import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

// Self-hosted fonts (no request to Google at build or run time).
// Arabic glyphs come from Cairo (sans) and Amiri (serif headings); the browser
// only downloads the Arabic subset when Arabic text is actually on the page.
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource-variable/eb-garamond";
import "@fontsource-variable/eb-garamond/wght-italic.css";
import "@fontsource-variable/manrope";
import "@fontsource-variable/cairo";
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "../globals.css";

import { dirOf, hasLocale, locales } from "@/src/i18n/config";
import { getDictionary } from "@/src/i18n/dictionaries";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { AuthProvider } from "@/src/providers/AuthProvider";
import ScrollVideoBackground from "@/src/components/ScrollVideoBackground";
import Navbar from "@/src/components/site/Navbar";
import Footer from "@/src/components/site/Footer";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: { default: dict.meta.homeTitle, template: "%s | AURUM" },
    description: dict.meta.homeDescription,
    applicationName: "AURUM",
    alternates: {
      languages: Object.fromEntries(locales.map((locale) => [locale, `/${locale}`])),
    },
    openGraph: {
      type: "website",
      siteName: "AURUM",
      locale: lang === "ar" ? "ar_AE" : "en_AE",
      title: dict.meta.homeTitle,
      description: dict.meta.homeDescription,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B111E",
  colorScheme: "dark",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} dir={dirOf(lang)} className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <I18nProvider lang={lang} dict={dict}>
          <AuthProvider>
            <ScrollVideoBackground />
            <div className="relative z-10 flex min-h-screen flex-col font-sans text-brand-ivory">
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-brand-gold focus:px-4 focus:py-2 focus:font-bold focus:text-brand-obsidian"
              >
                {dict.common.skipToContent}
              </a>
              <Navbar />
              <main id="main" className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
