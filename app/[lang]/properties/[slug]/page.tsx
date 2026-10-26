import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/src/i18n/config";
import { localized } from "@/src/i18n/format";
import { getProperties, getProperty } from "@/src/lib/server-api";
import PropertyDetailView from "@/src/components/PropertyDetailView";

export async function generateMetadata({ params }: PageProps<"/[lang]/properties/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const property = (await getProperty(slug)).data?.property;
  if (!property) return {};

  const title = localized(property as never, "title", lang);
  const description = localized(property as never, "description", lang).slice(0, 160);
  const image = property.images?.find((item) => item.is_primary)?.image_path ?? property.images?.[0]?.image_path;

  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}/properties/${slug}`,
      languages: Object.fromEntries(locales.map((locale) => [locale, `/${locale}/properties/${slug}`])),
    },
    openGraph: { type: "website", title, description, images: image ? [{ url: image }] : undefined },
  };
}

export default async function PropertyPage({ params }: PageProps<"/[lang]/properties/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();

  const result = await getProperty(slug);
  if (result.status === 404) notFound();
  if (!result.data) throw new Error("The property could not be loaded.");
  const property = result.data.property;

  const related = await getProperties(`?type_id=${property.type_id}`);
  const similar = (related.data?.data ?? []).filter((item) => item.id !== property.id).slice(0, 3);

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: localized(property as never, "title", lang),
    description: localized(property as never, "description", lang),
    url: `${site}/${lang}/properties/${slug}`,
    image: (property.images ?? []).map((item) => item.image_path),
    offers: { "@type": "Offer", price: Number(property.price), priceCurrency: "AED" },
    contentLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: localized(property.city as never, "name", lang), addressCountry: "AE" },
      geo: { "@type": "GeoCoordinates", latitude: Number(property.latitude), longitude: Number(property.longitude) },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PropertyDetailView property={property} similar={similar} />
    </>
  );
}
