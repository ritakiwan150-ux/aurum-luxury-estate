"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, ExternalLink, Heart, MapPin } from "lucide-react";
import { ApiProperty, api } from "../lib/api";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../providers/AuthProvider";
import PropertyCard from "./PropertyCard";
import PropertyImage from "./PropertyImage";
import { DynamicIcon } from "./ui/icons";

const inputClass = "w-full rounded border border-white/15 bg-black/20 p-3 text-brand-ivory";

export default function PropertyDetailView({ property, similar }: { property: ApiProperty; similar: ApiProperty[] }) {
  const { lang, dict, href, price, number, pick, text } = useI18n();
  const { user, token, favoriteIds, toggleFavorite } = useAuth();
  const router = useRouter();
  const d = dict.detail;

  const title = pick(property, "title") || "—";
  const description = pick(property, "description");
  const city = pick(property.city, "name");
  const type = pick(property.type, "name");
  const location = [property.district, city].filter(Boolean).join(lang === "ar" ? "، " : ", ");

  const images = [...(property.images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const [index, setIndex] = useState(0);
  const current = images[index];
  const move = (delta: number) => setIndex((value) => (value + delta + images.length) % images.length);

  const saved = favoriteIds.has(property.id);
  const handleFavorite = async () => {
    const allowed = await toggleFavorite(property.id);
    if (!allowed) router.push(`${href("/login")}?next=${encodeURIComponent(href(`/properties/${property.slug}`))}`);
  };

  const latitude = Number(property.latitude);
  const longitude = Number(property.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0);
  const mapEmbed = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.006}%2C${longitude + 0.01}%2C${latitude + 0.006}&layer=mapnik&marker=${latitude}%2C${longitude}`
    : null;
  const mapLink = hasCoordinates ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}` : null;

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(text(d.defaultMessage, { title }));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      await api.submitInquiry(property.id, { name: name.trim(), phone: phone.trim(), message: message.trim() }, token);
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : d.sendError);
    } finally {
      setSending(false);
    }
  }

  const facts = [
    { label: dict.common.beds, value: property.bedrooms ?? "—" },
    { label: dict.common.baths, value: property.bathrooms ?? "—" },
    { label: dict.common.area, value: `${number(property.area)} ${dict.common.sqft}` },
    { label: d.type, value: type || "—" },
    { label: d.operation, value: property.operation === "rent" ? dict.common.forRent : dict.common.forSale },
    ...(property.district ? [{ label: d.district, value: property.district }] : []),
  ];

  return (
    <div className="page-surface min-h-screen pb-24 pt-28">
      <div className="container-page">
        <Link href={href("/properties")} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-sand transition hover:text-brand-gold">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          {d.backToCollection}
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
          <div className="min-w-0 space-y-10">
            <section aria-label={title}>
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-brand-obsidian/60">
                <PropertyImage src={current?.image_path} alt={title} sizes="(min-width: 1024px) 60vw, 100vw" priority emptyLabel={dict.common.photosSoon} />
                {images.length > 1 && (
                  <>
                    <button type="button" onClick={() => move(-1)} aria-label={dict.common.back} className="absolute start-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-obsidian/80 text-brand-gold backdrop-blur hover:bg-brand-gold hover:text-brand-obsidian">
                      <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => move(1)} aria-label={dict.properties.next} className="absolute end-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-obsidian/80 text-brand-gold backdrop-blur hover:bg-brand-gold hover:text-brand-obsidian">
                      <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
                    </button>
                    <p className="absolute bottom-3 end-3 rounded bg-brand-obsidian/80 px-2 py-1 text-xs text-brand-sand">{text(d.gallery, { index: number(index + 1), total: number(images.length) })}</p>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.map((image, position) => (
                    <li key={image.id} className="shrink-0">
                      <button type="button" onClick={() => setIndex(position)} aria-label={text(d.gallery, { index: number(position + 1), total: number(images.length) })} aria-current={position === index} className={`relative block h-16 w-24 overflow-hidden rounded-lg border-2 transition ${position === index ? "border-brand-gold" : "border-transparent opacity-70 hover:opacity-100"}`}>
                        <PropertyImage src={image.image_path} alt="" sizes="96px" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {property.is_featured && <span className="rounded bg-brand-gold px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-obsidian">{dict.common.exclusive}</span>}
                <span className="rounded border border-brand-gold/40 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-gold">{property.operation === "rent" ? dict.common.forRent : dict.common.forSale}</span>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="font-serif text-4xl font-bold text-brand-ivory md:text-5xl">{title}</h1>
                  {location && <p className="flex items-center gap-2 text-brand-sand"><MapPin className="h-4 w-4 text-brand-gold" aria-hidden="true" />{location}</p>}
                </div>
                <button type="button" onClick={() => void handleFavorite()} aria-pressed={saved} className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 px-4 py-2 text-sm font-semibold text-brand-gold transition hover:bg-brand-gold hover:text-brand-obsidian">
                  <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
                  {saved ? dict.common.unsave : dict.common.save}
                </button>
              </div>
              <p className="font-serif text-3xl font-bold text-brand-gold" dir="ltr">{price(property.price)}</p>
            </header>

            <dl className="grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-brand-obsidian/60 p-5 sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-[11px] uppercase text-brand-muted">{fact.label}</dt>
                  <dd className="mt-1 font-bold text-brand-ivory">{fact.value}</dd>
                </div>
              ))}
            </dl>

            {description && (
              <section>
                <h2 className="mb-3 font-serif text-2xl font-bold text-brand-gold">{d.about}</h2>
                <p className="whitespace-pre-line leading-relaxed text-brand-sand">{description}</p>
              </section>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <section>
                <h2 className="mb-4 font-serif text-2xl font-bold text-brand-gold">{d.amenities}</h2>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <li key={amenity.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-brand-obsidian/60 px-4 py-3 text-sm text-brand-ivory">
                      {amenity.icon ? <DynamicIcon name={amenity.icon} className="h-4 w-4 shrink-0 text-brand-gold" /> : <Check className="h-4 w-4 shrink-0 text-brand-gold" aria-hidden="true" />}
                      {pick(amenity, "name")}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {mapEmbed && (
              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-serif text-2xl font-bold text-brand-gold">{d.location}</h2>
                  <a href={mapLink ?? undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-sand hover:text-brand-gold">
                    {d.openInMaps}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
                <iframe title={`${d.location}: ${title}`} src={mapEmbed} loading="lazy" referrerPolicy="no-referrer" className="h-80 w-full rounded-xl border border-white/10" dir="ltr" />
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <form onSubmit={handleInquiry} className="glass-panel space-y-4 rounded-2xl p-6">
              <h2 className="font-serif text-2xl font-bold text-brand-gold">{d.inquiryTitle}</h2>
              <p className="text-sm text-brand-muted">{d.inquirySubtitle}</p>
              {sent ? (
                <p role="status" className="rounded border border-green-400/30 bg-green-400/10 p-4 text-sm text-green-100">{d.success}</p>
              ) : (
                <>
                  <label className="grid gap-1 text-xs text-brand-muted">{d.name}<input required maxLength={255} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
                  <label className="grid gap-1 text-xs text-brand-muted">{d.phone}<input required type="tel" dir="ltr" maxLength={20} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={`${inputClass} text-start`} /></label>
                  <label className="grid gap-1 text-xs text-brand-muted">{d.message}<textarea required rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className={inputClass} /></label>
                  {error && <p role="alert" className="rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
                  <button disabled={sending} className="w-full rounded bg-brand-gold px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-brand-obsidian transition hover:brightness-110 disabled:opacity-60">
                    {sending ? d.sending : d.send}
                  </button>
                </>
              )}
            </form>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-20" aria-labelledby="similar-heading">
            <h2 id="similar-heading" className="mb-8 font-serif text-3xl font-bold text-brand-ivory">{d.similar}</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((item) => <PropertyCard key={item.id} property={item} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
