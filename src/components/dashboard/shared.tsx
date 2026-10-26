import type { ReactNode } from "react";
import { ApiError, ApiProperty } from "../../lib/api";
import type { Locale } from "../../i18n/config";
import { useI18n } from "../../i18n/I18nProvider";

export { formatPrice } from "../../i18n/format";

export function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

export function formatDate(value?: string | null, lang: Locale = "en"): string {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function primaryImageUrl(property: ApiProperty): string | null {
  return (
    property.images?.find((image) => image.is_primary)?.image_path ??
    property.images?.[0]?.image_path ??
    null
  );
}

const propertyStatusStyles: Record<string, string> = {
  published: "border-green-400/40 bg-green-400/10 text-green-200",
  pending: "border-brand-gold/40 bg-brand-gold/10 text-brand-gold",
  rejected: "border-red-400/40 bg-red-400/10 text-red-200",
  archived: "border-white/20 bg-white/5 text-brand-muted",
};
const propertyStatusLabels: Record<string, string> = {
  published: "Published",
  pending: "Pending review",
  rejected: "Rejected",
  archived: "Archived",
};

export function StatusBadge({ status }: { status?: string }) {
  const { t } = useI18n();
  const key = status ?? "pending";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${propertyStatusStyles[key] ?? propertyStatusStyles.archived}`}>
      {t(propertyStatusLabels[key] ?? key)}
    </span>
  );
}

const brokerStyles: Record<string, string> = {
  verified: "border-green-400/40 bg-green-400/10 text-green-200",
  pending: "border-brand-gold/40 bg-brand-gold/10 text-brand-gold",
  rejected: "border-red-400/40 bg-red-400/10 text-red-200",
  not_applicable: "border-white/20 bg-white/5 text-brand-muted",
};
const brokerLabels: Record<string, string> = {
  verified: "Verified",
  pending: "Pending",
  rejected: "Rejected",
  not_applicable: "No license",
};

export function BrokerBadge({ status }: { status?: string }) {
  const { t } = useI18n();
  const key = status ?? "not_applicable";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${brokerStyles[key] ?? brokerStyles.not_applicable}`}>
      {t(brokerLabels[key] ?? key)}
    </span>
  );
}

export function Notice({ kind, children }: { kind: "ok" | "error"; children: ReactNode }) {
  return kind === "ok" ? (
    <p role="status" className="rounded border border-green-400/30 bg-green-400/10 p-3 text-sm text-green-100">{children}</p>
  ) : (
    <p role="alert" className="rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{children}</p>
  );
}
