"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { ApiProperty, api } from "../lib/api";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../providers/AuthProvider";
import PropertyCard from "./PropertyCard";

export default function FavoritesList() {
  const { dict, href } = useI18n();
  const { token, ready } = useAuth();
  const router = useRouter();
  const p = dict.properties;
  const [items, setItems] = useState<ApiProperty[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`${href("/login")}?next=${encodeURIComponent(href("/favorites"))}`);
      return;
    }
    let active = true;
    api.favorites(token)
      .then((response) => {
        if (!active) return;
        setItems(response.favorites.map((entry) => entry.property).filter((item): item is ApiProperty => Boolean(item)));
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [ready, token, router, href]);

  return (
    <div className="page-surface min-h-screen pb-24 pt-32">
      <div className="container-page">
        <header className="mb-10 border-b border-white/10 pb-8">
          <h1 className="mb-3 font-serif text-5xl font-bold text-brand-ivory md:text-6xl">{p.favoritesTitle}</h1>
          <p className="text-brand-sand">{p.favoritesSubtitle}</p>
        </header>

        {failed && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-6 text-red-100">{p.loadError}</p>}
        {!failed && items === null && <p role="status" className="text-brand-muted">{dict.common.loading}</p>}

        {items && items.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-14 text-center">
            <Heart className="h-10 w-10 text-brand-gold/60" aria-hidden="true" />
            <p className="font-serif text-2xl font-bold text-brand-gold">{p.favoritesEmpty}</p>
            <p className="max-w-sm text-sm text-brand-muted">{p.favoritesEmptyHint}</p>
            <Link href={href("/properties")} className="rounded bg-brand-gold px-5 py-3 text-xs font-bold uppercase tracking-widest text-brand-obsidian transition hover:brightness-110">
              {p.browse}
            </Link>
          </div>
        )}

        {items && items.length > 0 && (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onFavoriteChange={(saved) => !saved && setItems((current) => current?.filter((item) => item.id !== property.id) ?? current)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
