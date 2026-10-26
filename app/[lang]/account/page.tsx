import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { hasLocale } from "@/src/i18n/config";
import { getDictionary } from "@/src/i18n/dictionaries";
import AccountPage from "@/src/components/AccountPage";

export async function generateMetadata({ params }: PageProps<"/[lang]/account">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.meta.accountTitle, robots: { index: false } };
}

export default async function AccountRoute({ params }: PageProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <AccountPage />;
}
