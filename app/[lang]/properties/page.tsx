import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "@/src/i18n/config";
import { getDictionary } from "@/src/i18n/dictionaries";
import { getCities, getPropertyTypes } from "@/src/lib/server-api";
import PropertiesBrowser from "@/src/components/PropertiesBrowser";

export async function generateMetadata({ params }: PageProps<"/[lang]/properties">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.propertiesTitle,
    description: dict.meta.propertiesDescription,
    alternates: { canonical: `/${lang}/properties` },
  };
}

export default async function PropertiesPage({ params }: PageProps<"/[lang]/properties">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [cities, types] = await Promise.all([getCities(), getPropertyTypes()]);

  return (
    <Suspense fallback={<div className="page-surface min-h-screen" />}>
      <PropertiesBrowser cities={cities.data?.cities ?? []} propertyTypes={types.data?.property_types ?? []} />
    </Suspense>
  );
}
