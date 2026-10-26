import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "@/src/i18n/config";
import { getDictionary } from "@/src/i18n/dictionaries";
import ConciergeForm from "@/src/components/ConciergeForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/concierge">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.meta.conciergeTitle, description: dict.meta.conciergeDescription };
}

export default async function ConciergePage({ params }: PageProps<"/[lang]/concierge">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <Suspense fallback={<div className="page-surface min-h-screen" />}>
      <ConciergeForm />
    </Suspense>
  );
}
