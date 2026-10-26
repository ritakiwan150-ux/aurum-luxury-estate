"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AdminAnalytics, api } from "../../../lib/api";
import { useI18n } from "../../../i18n/I18nProvider";
import { errorMessage } from "../shared";
import BarList from "../charts/BarList";
import DonutChart from "../charts/DonutChart";
import LineChart from "../charts/LineChart";
import Sparkline from "../charts/Sparkline";

export type OverviewTarget = "properties" | "inquiries" | "users";

const COLORS = { gold: "#D4AF37", green: "#4ADE80", red: "#F87171", sky: "#38BDF8", violet: "#A78BFA", slate: "#94A3B8", amber: "#FBBF24" };

function Card({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`glass-panel rounded-xl p-6 ${className}`}>
      <h3 className="font-serif text-xl font-bold text-brand-ivory">{title}</h3>
      {subtitle && <p className="mb-4 text-xs text-brand-muted">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

function Kpi({ label, value, trend, spark, color }: { label: string; value: number; trend?: { recent: number; previous: number; days: number }; spark?: AdminAnalytics["inquiries_by_day"]; color?: string }) {
  const { t, number } = useI18n();
  let delta: number | null = null;
  if (trend) delta = trend.previous === 0 ? (trend.recent > 0 ? 100 : 0) : Math.round(((trend.recent - trend.previous) / trend.previous) * 100);

  return (
    <article className="glass-panel flex flex-col gap-2 rounded-xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">{label}</p>
      <p className="font-serif text-4xl font-bold text-brand-gold">{number(value)}</p>
      {spark && <Sparkline data={spark} color={color} />}
      {trend && delta !== null && (
        <p className={`text-xs font-semibold ${delta > 0 ? "text-green-300" : delta < 0 ? "text-red-300" : "text-brand-muted"}`} title={t("vs the previous {days} days", { days: trend.days })}>
          <span aria-hidden="true">{delta > 0 ? "▲" : delta < 0 ? "▼" : "•"}</span>{" "}
          {delta === 0 ? t("No change") : <span dir="ltr">{`${delta > 0 ? "+" : ""}${number(delta)}%`}</span>}
          <span className="ms-1.5 font-normal text-brand-muted">{t("vs the previous {days} days", { days: trend.days })}</span>
        </p>
      )}
    </article>
  );
}

export default function AdminOverview({ token, onOpenTab }: { token: string; onOpenTab: (tab: OverviewTarget) => void }) {
  const { t } = useI18n();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api.adminAnalytics(token));
    } catch (cause) {
      setError(errorMessage(cause, t("Could not load analytics.")));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    // The loading flag is raised before the request starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (!data) {
    return (
      <div className="space-y-4">
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-red-100">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="rounded border border-red-200/40 px-4 py-2 text-xs font-bold uppercase">{t("Try again")}</button>
          </div>
        )}
        {loading && !error && <p role="status" className="text-sm text-brand-muted">{t("Loading…")}</p>}
      </div>
    );
  }

  return <OverviewContent data={data} loading={loading} onRefresh={() => void load()} onOpenTab={onOpenTab} />;
}

export function OverviewContent({ data, loading, onRefresh, onOpenTab }: { data: AdminAnalytics; loading: boolean; onRefresh: () => void; onOpenTab: (tab: OverviewTarget) => void }) {
  const { t, lang, number, pick } = useI18n();
  const { kpis, days } = data;
  const named = (item: { name_ar: string; name_en: string }) => pick(item, "name");
  const updated = new Date(data.generated_at).toLocaleTimeString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { hour: "2-digit", minute: "2-digit" });

  const attention = [
    { target: "properties" as const, title: t("Property reviews"), text: t("{count} listings are waiting for approval", { count: number(kpis.properties.pending) }), count: kpis.properties.pending },
    { target: "inquiries" as const, title: t("New inquiries"), text: t("{count} inquiries have not been answered", { count: number(kpis.inquiries.unanswered) }), count: kpis.inquiries.unanswered },
    { target: "users" as const, title: t("Broker licenses"), text: t("{count} licenses are waiting for verification", { count: number(kpis.users.pending_brokers) }), count: kpis.users.pending_brokers },
  ].filter((item) => item.count > 0);

  const statusSlices = [
    { label: t("Published"), value: data.properties_by_status.published ?? 0, color: COLORS.green },
    { label: t("Pending review"), value: data.properties_by_status.pending ?? 0, color: COLORS.gold },
    { label: t("Rejected"), value: data.properties_by_status.rejected ?? 0, color: COLORS.red },
    { label: t("Archived"), value: data.properties_by_status.archived ?? 0, color: COLORS.slate },
  ];
  const roleSlices = [
    { label: t("Clients"), value: data.users_by_role.client ?? 0, color: COLORS.sky },
    { label: t("Owners"), value: data.users_by_role.owner ?? 0, color: COLORS.gold },
    { label: t("Admins"), value: data.users_by_role.admin ?? 0, color: COLORS.violet },
  ];
  const inquirySlices = [
    { label: t("New"), value: data.inquiries_by_status.new ?? 0, color: COLORS.amber },
    { label: t("Contacted"), value: data.inquiries_by_status.contacted ?? 0, color: COLORS.sky },
    { label: t("Closed"), value: data.inquiries_by_status.closed ?? 0, color: COLORS.green },
  ];

  return (
    <div className="space-y-8" aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {attention.length === 0 ? (
          <p role="status" className="rounded-full border border-green-400/30 bg-green-400/10 px-4 py-2 text-sm text-green-100">
            ✓ {t("All caught up")} — {t("Nothing needs your attention right now.")}
          </p>
        ) : (
          <h2 className="font-serif text-2xl font-bold text-brand-ivory">{t("Needs attention")}</h2>
        )}
        <div className="flex items-center gap-3 text-xs text-brand-muted">
          <span>{t("Updated {time}", { time: updated })}</span>
          <button type="button" onClick={onRefresh} disabled={loading} className="rounded border border-white/15 px-3 py-1.5 font-semibold text-brand-sand transition hover:border-brand-gold hover:text-brand-gold disabled:opacity-50">
            {loading ? t("Loading…") : t("Refresh")}
          </button>
        </div>
      </div>

      {attention.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {attention.map((item) => (
            <button key={item.target} type="button" onClick={() => onOpenTab(item.target)} className="group rounded-xl border border-brand-gold/40 bg-brand-gold/10 p-5 text-start transition hover:bg-brand-gold/20">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">{item.title}</p>
              <p className="mt-2 font-serif text-lg text-brand-ivory">{item.text}</p>
              <p className="mt-3 text-xs font-bold text-brand-gold">{t("Open")} <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span></p>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi label={t("Published listings")} value={kpis.properties.published} />
        <Kpi label={t("Total views")} value={kpis.properties.views} />
        <Kpi label={t("Inquiries ({days} days)", { days })} value={kpis.inquiries.recent} trend={{ recent: kpis.inquiries.recent, previous: kpis.inquiries.previous, days }} spark={data.inquiries_by_day} />
        <Kpi label={t("New users ({days} days)", { days })} value={kpis.users.recent} trend={{ recent: kpis.users.recent, previous: kpis.users.previous, days }} spark={data.users_by_day} color={COLORS.sky} />
        <Kpi label={t("Total users")} value={kpis.users.total} />
        <Kpi label={t("Featured listings")} value={kpis.properties.featured} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("Inquiries over time")} subtitle={t("Last {days} days", { days })}>
          <LineChart data={data.inquiries_by_day} label={t("Inquiries over time")} />
        </Card>
        <Card title={t("New users over time")} subtitle={t("Last {days} days", { days })}>
          <LineChart data={data.users_by_day} label={t("New users over time")} color={COLORS.sky} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={t("Listings by status")}><DonutChart slices={statusSlices} label={t("Listings by status")} /></Card>
        <Card title={t("Inquiries by status")}><DonutChart slices={inquirySlices} label={t("Inquiries by status")} /></Card>
        <Card title={t("Users by role")}><DonutChart slices={roleSlices} label={t("Users by role")} /></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={t("Listings by property type")}>
          <BarList items={data.properties_by_type.map((row) => ({ key: row.name_en, label: named(row), value: row.count }))} />
        </Card>
        <Card title={t("Listings by city")}>
          <BarList color={COLORS.sky} items={data.properties_by_city.map((row) => ({ key: row.name_en, label: named(row), value: row.count }))} />
        </Card>
        <Card title={t("Most viewed listings")}>
          <BarList
            color={COLORS.green}
            items={data.top_properties.map((row) => ({ key: row.id, label: pick(row, "title") || `#${row.id}`, value: row.views, hint: t("{count} inquiries", { count: number(row.inquiries) }) }))}
          />
        </Card>
      </div>
    </div>
  );
}
