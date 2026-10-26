import { notFound } from "next/navigation";
import Link from "next/link";
import { hasLocale } from "@/src/i18n/config";
import { getDictionary } from "@/src/i18n/dictionaries";
import { getCities, getPropertyTypes, getProperties } from "@/src/lib/server-api";
import Hero from "@/src/components/Hero";
import ExplodedView from "@/src/components/ExplodedView";
import PropertyCard from "@/src/components/PropertyCard";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const [cities, types, properties] = await Promise.all([
    getCities(),
    getPropertyTypes(),
    getProperties("?sort_by=created_at&sort_direction=desc"),
  ]);

  // Featured listings first, then the newest ones.
  const featured = [...(properties.data?.data ?? [])]
    .sort((a, b) => Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)))
    .slice(0, 6);

  return (
    <>
      <Hero
        cities={cities.data?.cities ?? []}
        propertyTypes={types.data?.property_types ?? []}
        optionsFailed={!cities.ok || !types.ok}
      />
      <ExplodedView />

      <section className="page-surface py-24" aria-labelledby="featured-heading">
        <div className="container-page">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-6">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">{dict.home.featuredEyebrow}</p>
              <h2 id="featured-heading" className="font-serif text-4xl font-bold text-brand-ivory md:text-5xl">
                {dict.home.featuredTitle} <span className="font-normal italic text-brand-gold">{dict.home.featuredAccent}</span>
              </h2>
            </div>
            <Link href={`/${lang}/properties`} className="border-b border-brand-gold pb-1 text-xs font-extrabold uppercase tracking-widest text-brand-gold transition hover:text-brand-amber">
              {dict.home.viewAll}
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((property, index) => (
                <PropertyCard key={property.id} property={property} priority={index < 3} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center text-brand-muted">
              {properties.ok ? dict.home.featuredEmpty : dict.home.featuredError}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
