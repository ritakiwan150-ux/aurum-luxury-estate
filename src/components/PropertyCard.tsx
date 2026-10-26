"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MapPin } from "lucide-react";
import type { ApiProperty } from "../lib/api";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../providers/AuthProvider";
import PropertyImage from "./PropertyImage";

export function propertyImageUrl(property: ApiProperty): string | null {
  return property.images?.find((image) => image.is_primary)?.image_path ?? property.images?.[0]?.image_path ?? null;
}

interface PropertyCardProps {
  property: ApiProperty;
  priority?: boolean;
  /** Called after the heart is toggled by a signed-in visitor, with the new saved state. */
  onFavoriteChange?: (saved: boolean) => void;
}

export default function PropertyCard({ property, priority = false, onFavoriteChange }: PropertyCardProps) {
  const { lang, dict, href, price, number, pick } = useI18n();
  const { favoriteIds, toggleFavorite } = useAuth();
  const router = useRouter();

  const title = pick(property, "title") || "—";
  const city = pick(property.city, "name");
  const type = pick(property.type, "name");
  const location = [property.district, city].filter(Boolean).join(lang === "ar" ? "، " : ", ");
  const saved = favoriteIds.has(property.id);
  const detailHref = href(`/properties/${property.slug}`);

  const handleFavorite = async () => {
    const allowed = await toggleFavorite(property.id);
    if (!allowed) router.push(`${href("/login")}?next=${encodeURIComponent(detailHref)}`);
    else onFavoriteChange?.(!saved);
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-brand-obsidian/70 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-brand-gold/40">
      <Link href={detailHref} className="relative block aspect-[4/3] overflow-hidden" aria-label={`${dict.common.viewDetails}: ${title}`}>
        <PropertyImage
          src={propertyImageUrl(property)}
          alt={title}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 90vw"
          priority={priority}
          emptyLabel={dict.common.photosSoon}
          className="transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-obsidian/80 to-transparent" />
        <div className="absolute start-3 top-3 flex gap-2">
          {property.is_featured && <span className="rounded bg-brand-gold px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-obsidian">{dict.common.exclusive}</span>}
          <span className="rounded bg-brand-obsidian/80 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-gold backdrop-blur">
            {property.operation === "rent" ? dict.common.forRent : dict.common.forSale}
          </span>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => void handleFavorite()}
        aria-pressed={saved}
        aria-label={saved ? dict.common.unsave : dict.common.save}
        className="absolute end-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-brand-obsidian/80 text-brand-gold backdrop-blur transition hover:bg-brand-gold hover:text-brand-obsidian"
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
      </button>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="line-clamp-2 font-serif text-xl font-bold text-brand-ivory">
            <Link href={detailHref} className="hover:text-brand-gold">{title}</Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-brand-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-gold" aria-hidden="true" />
            <span className="truncate">{location || type}</span>
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2 border-y border-white/10 py-3 text-center text-xs">
          <div><dt className="text-[11px] uppercase text-brand-muted">{dict.common.beds}</dt><dd className="font-bold text-brand-gold">{property.bedrooms ?? "—"}</dd></div>
          <div><dt className="text-[11px] uppercase text-brand-muted">{dict.common.baths}</dt><dd className="font-bold text-brand-gold">{property.bathrooms ?? "—"}</dd></div>
          <div><dt className="text-[11px] uppercase text-brand-muted">{dict.common.area}</dt><dd className="font-bold text-brand-gold">{number(property.area)} <span className="font-normal text-brand-muted">{dict.common.sqft}</span></dd></div>
        </dl>

        <div className="mt-auto flex flex-col gap-3">
          <div>
            <p className="text-[11px] uppercase text-brand-muted">{dict.properties.offeredAt}</p>
            <p className="font-serif text-xl font-bold text-brand-ivory" dir="ltr">{price(property.price)}</p>
          </div>
          <Link href={`${href("/concierge")}?property=${property.id}`} className="block w-full rounded border border-brand-gold/40 px-3 py-2.5 text-center text-[11px] font-extrabold uppercase tracking-wider text-brand-gold transition hover:bg-brand-gold hover:text-brand-obsidian">
            {dict.common.requestViewing}
          </Link>
        </div>
      </div>
    </article>
  );
}
