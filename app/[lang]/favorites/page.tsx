import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { hasLocale } from "@/src/i18n/config";
import { getDictionary } from "@/src/i18n/dictionaries";
import FavoritesList from "@/src/components/FavoritesList";

export async function generateMetadata({ params }: PageProps<"/[lang]/favorites">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.meta.favoritesTitle, robots: { index: false } };
}

export default async function FavoritesPage({ params }: PageProps<"/[lang]/favorites">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <FavoritesList />;
}
