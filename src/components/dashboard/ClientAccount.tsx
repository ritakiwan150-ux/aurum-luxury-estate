"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { ViewType } from "../../types";
import { ApiInquiry, ApiProperty, ApiUser, api } from "../../lib/api";
import { useAuth } from "../../providers/AuthProvider";
import AccountSettings from "./AccountSettings";
import { Notice, errorMessage, formatDate, primaryImageUrl } from "./shared";
import { useI18n } from "../../i18n/I18nProvider";

type ClientTab = "favorites" | "inquiries" | "settings";

interface ClientAccountProps {
  user: ApiUser;
  token: string;
  setView: (view: ViewType) => void;
  onUserUpdate?: (user: ApiUser) => void;
}

const clientTabs: Array<{ id: ClientTab; label: string }> = [
  { id: "favorites", label: "Favorites" },
  { id: "inquiries", label: "My inquiries" },
  { id: "settings", label: "Account settings" },
];

export default function ClientAccount({ user, token, setView, onUserUpdate }: ClientAccountProps) {
  const { t, price, lang } = useI18n();
  const { removeFavorite: removeFavoriteEverywhere } = useAuth();
  const [tab, setTab] = useState<ClientTab>("favorites");
  const [favorites, setFavorites] = useState<ApiProperty[]>([]);
  const [inquiries, setInquiries] = useState<ApiInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.favorites(token);
      setFavorites(response.favorites.map((entry) => entry.property).filter((item): item is ApiProperty => Boolean(item)));
    } catch (cause) {
      setError(errorMessage(cause, t("Could not load your favorites.")));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setInquiries((await api.myInquiries(token)).inquiries);
    } catch (cause) {
      setError(errorMessage(cause, t("Could not load your inquiries.")));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    // Loading updates the pending indicator before awaiting the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === "favorites") void loadFavorites();
    else if (tab === "inquiries") void loadInquiries();
  }, [tab, loadFavorites, loadInquiries]);

  const removeFavorite = async (property: ApiProperty) => {
    setRemovingId(property.id);
    setError("");
    // Goes through the shared auth state so every heart on the site updates, not only this list.
    const removed = await removeFavoriteEverywhere(property.id);
    if (removed) setFavorites((current) => current.filter((item) => item.id !== property.id));
    else setError(t("Could not remove this property from your favorites."));
    setRemovingId(null);
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel flex flex-wrap items-center gap-4 rounded-xl p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-gold/50 bg-brand-gold/10 font-serif text-2xl text-brand-gold">
          {user.name.trim().charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-xl">{user.name}</p>
          <p className="truncate text-sm text-brand-muted">{user.email}</p>
        </div>
        <span className="rounded-full border border-brand-gold/50 bg-brand-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-gold">
          {t("Client")}
        </span>
      </section>

      <nav className="flex flex-wrap gap-2" aria-label={t("Account sections")}>
        {clientTabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`rounded border px-4 py-2 text-sm ${tab === item.id ? "border-brand-gold bg-brand-gold text-brand-obsidian" : "border-white/15 text-brand-sand hover:border-brand-gold"}`}
          >
            {t(item.label)}
          </button>
        ))}
      </nav>

      {error && <Notice kind="error">{error}</Notice>}
      {loading && <p role="status" className="text-sm text-brand-muted">{t("Loading…")}</p>}

      {tab === "favorites" && (
        <section className="glass-panel rounded-xl p-6">
          <h2 className="mb-4 font-serif text-2xl">{t("Saved properties")}</h2>
          {!loading && favorites.length === 0 && !error && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <Heart className="h-10 w-10 text-brand-gold/60" />
              <p className="font-serif text-xl">{t("No saved properties yet")}</p>
              <p className="max-w-sm text-sm text-brand-muted">{t("Tap the heart on any listing to keep it here for later.")}</p>
              <button onClick={() => setView("properties")} className="rounded bg-brand-gold px-5 py-3 text-xs font-bold uppercase tracking-widest text-brand-obsidian transition hover:brightness-110">
                {t("Browse properties")}
              </button>
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((property) => {
              const image = primaryImageUrl(property);
              const location = [property.district, property.city?.name_en].filter(Boolean).join(", ");
              return (
                <article key={property.id} className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
                  <div className="aspect-[4/3] bg-black/30">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={property.title_en || property.title_ar || t("Property")} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-brand-muted">{t("No image")}</div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="truncate font-bold">{property.title_en || property.title_ar}</h3>
                    <p className="text-sm text-brand-muted">{location || "—"}</p>
                    <p className="font-serif text-lg text-brand-gold">{price(property.price)}</p>
                    <button
                      onClick={() => void removeFavorite(property)}
                      disabled={removingId === property.id}
                      className="w-full rounded border border-red-300/30 px-3 py-2 text-xs text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removingId === property.id ? t("Removing…") : t("Remove from favorites")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {tab === "inquiries" && (
        <section className="glass-panel rounded-xl p-6">
          <h2 className="mb-1 font-serif text-2xl">{t("My inquiries")}</h2>
          <p className="mb-4 text-sm text-brand-muted">{t("Viewing requests you sent while signed in.")}</p>
          {!loading && inquiries.length === 0 && !error ? (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-sm text-brand-muted">{t("You have not sent any inquiries yet.")}</p>
              <button onClick={() => setView("viewing")} className="rounded border border-brand-gold/50 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">
                {t("Request a private viewing")}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-brand-muted">
                  <tr><th className="p-3">{t("Property")}</th><th className="p-3">{t("Message")}</th><th className="p-3">{t("Date")}</th><th className="p-3">{t("Status")}</th></tr>
                </thead>
                <tbody>
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="border-t border-white/10 align-top">
                      <td className="p-3">{inquiry.property?.title_en || inquiry.property?.title_ar || `#${inquiry.property_id}`}</td>
                      <td className="max-w-sm whitespace-pre-wrap p-3">{inquiry.message}</td>
                      <td className="whitespace-nowrap p-3">{formatDate(inquiry.created_at, lang)}</td>
                      <td className="p-3 capitalize">{inquiry.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "settings" && <AccountSettings user={user} token={token} onUserUpdate={onUserUpdate} />}
    </div>
  );
}
