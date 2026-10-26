import type { MetadataRoute } from "next";
import { locales } from "@/src/i18n/config";
import { getProperties } from "@/src/lib/server-api";

// Regenerated at most once an hour, so new listings appear without a rebuild.
export const revalidate = 3600;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function entry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE}/${locales[0]}${path}`,
    changeFrequency: "weekly",
    priority,
    alternates: { languages: Object.fromEntries(locales.map((locale) => [locale, `${SITE}/${locale}${path}`])) },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["", "/properties", "/about", "/concierge"];
  const entries = paths.map((path) => entry(path, path === "" ? 1 : 0.8));

  for (let page = 1; page <= 20; page++) {
    const result = await getProperties(`?page=${page}`);
    if (!result.data) break;
    result.data.data.forEach((property) => entries.push(entry(`/properties/${property.slug}`, 0.7)));
    if (page >= result.data.last_page) break;
  }
  return entries;
}
