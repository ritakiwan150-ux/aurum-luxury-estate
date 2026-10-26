"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { ApiNamedItem, ApiProperty, api } from "../lib/api";
import { useI18n } from "../i18n/I18nProvider";
import PropertyCard from "./PropertyCard";
import Select, { type SelectOption } from "./ui/Select";
import { DynamicIcon } from "./ui/icons";

type SortKey = "newest" | "price_asc" | "price_desc" | "area_desc";

const SORT_PARAMS: Record<SortKey, { sort_by: string; sort_direction: string }> = {
  newest: { sort_by: "created_at", sort_direction: "desc" },
  price_asc: { sort_by: "price", sort_direction: "asc" },
  price_desc: { sort_by: "price", sort_direction: "desc" },
  area_desc: { sort_by: "area", sort_direction: "desc" },
};

interface Filters {
  q: string;
  type: string; // comma separated property type ids
  city: string;
  op: string;
  min: string;
  max: string;
  beds: string;
  sort: SortKey;
  page: number;
}

function readFilters(params: URLSearchParams): Filters {
  const sort = params.get("sort") as SortKey | null;
  return {
    q: params.get("q") ?? "",
    type: params.get("type") ?? "",
    city: params.get("city") ?? "",
    op: params.get("op") ?? "",
    min: params.get("min") ?? "",
    max: params.get("max") ?? "",
    beds: params.get("beds") ?? "",
    sort: sort && sort in SORT_PARAMS ? sort : "newest",
    page: Math.max(1, Number(params.get("page")) || 1),
  };
}

function toApiParams(filters: Filters): Record<string, string | number | undefined> {
  return {
    q: filters.q || undefined,
    type_ids: filters.type || undefined,
    city_id: filters.city || undefined,
    operation: filters.op || undefined,
    min_price: filters.min || undefined,
    max_price: filters.max || undefined,
    bedrooms: filters.beds || undefined,
    ...SORT_PARAMS[filters.sort],
    page: filters.page,
  };
}

function PriceField({ label, value, onCommit }: { label: string; value: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    // Keep the box in sync when filters are cleared or changed elsewhere.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(value);
  }, [value]);
  return (
    <label className="grid gap-1 text-xs text-brand-muted">
      {label}
      <input
        type="number"
        min={0}
        inputMode="numeric"
        dir="ltr"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => draft !== value && onCommit(draft)}
        onKeyDown={(event) => event.key === "Enter" && onCommit(draft)}
        className="w-full rounded border border-white/15 bg-black/20 p-2.5 text-sm text-brand-ivory"
      />
    </label>
  );
}

export default function PropertiesBrowser({ cities, propertyTypes }: { cities: ApiNamedItem[]; propertyTypes: ApiNamedItem[] }) {
  const { dict, text, number, pick } = useI18n();
  const p = dict.properties;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const queryKey = searchParams.toString();
  const filters = readFilters(new URLSearchParams(queryKey));

  const [items, setItems] = useState<ApiProperty[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchText, setSearchText] = useState(filters.q);

  function update(patch: Partial<Record<keyof Filters, string | number>>) {
    const params = new URLSearchParams(queryKey);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === "" || value === undefined || (key === "sort" && value === "newest") || (key === "page" && value === 1)) params.delete(key);
      else params.set(key, String(value));
    });
    if (!("page" in patch)) params.delete("page");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }
  const commitSearch = useEffectEvent((value: string) => update({ q: value.trim() }));

  // Fetch whenever the URL filters change.
  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setFailed(false);
    api.properties(toApiParams(readFilters(new URLSearchParams(queryKey))))
      .then((response) => {
        if (!active) return;
        setItems(response.data);
        setLastPage(response.last_page);
        setTotal(response.total ?? response.data.length);
      })
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [queryKey, attempt]);

  // Search box: sync from the URL, and debounce typing into the URL.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchText(filters.q);
  }, [filters.q]);
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchText !== filters.q) commitSearch(searchText);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchText, filters.q]);

  const selectedTypes = filters.type ? filters.type.split(",") : [];
  const toggleType = (id: string) => {
    const next = selectedTypes.includes(id) ? selectedTypes.filter((value) => value !== id) : [...selectedTypes, id];
    update({ type: next.join(",") });
  };

  const activeCount = [filters.q, filters.type, filters.city, filters.op, filters.min, filters.max, filters.beds].filter(Boolean).length;

  const cityOptions: SelectOption[] = [
    { value: "", label: p.allCities, icon: "map-pin" },
    ...cities.map((city) => ({ value: String(city.id), label: pick(city as unknown as Record<string, unknown>, "name"), icon: "map-pin" })),
  ];
  const bedOptions: SelectOption[] = [{ value: "", label: p.any, icon: "bed-double" }, ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: number(n), icon: "bed-double" }))];
  const sortOptions: SelectOption[] = [
    { value: "newest", label: p.sortNewest },
    { value: "price_asc", label: p.sortPriceAsc },
    { value: "price_desc", label: p.sortPriceDesc },
    { value: "area_desc", label: p.sortAreaDesc },
  ];
  const operationOptions = [
    { value: "", label: p.any },
    { value: "sale", label: dict.common.forSale },
    { value: "rent", label: dict.common.forRent },
  ];

  const goToPage = (page: number) => {
    update({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="page-surface min-h-screen pb-24 pt-32">
      <div className="container-page">
        <header className="mb-10 border-b border-white/10 pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">{p.eyebrow}</p>
          <h1 className="mb-3 font-serif text-5xl font-bold text-brand-ivory md:text-6xl">{p.title}</h1>
          <p className="max-w-2xl text-brand-sand">{p.subtitle}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
              aria-controls="filters-panel"
              className="mb-4 flex w-full items-center justify-between rounded-lg border border-brand-gold/30 bg-brand-obsidian/70 px-4 py-3 text-sm font-bold text-brand-gold lg:hidden"
            >
              <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{p.filters}</span>
              {activeCount > 0 && <span className="rounded-full bg-brand-gold px-2 py-0.5 text-xs text-brand-obsidian">{number(activeCount)}</span>}
            </button>

            <div id="filters-panel" className={`${filtersOpen ? "block" : "hidden"} space-y-6 rounded-xl border border-white/10 bg-brand-obsidian/70 p-5 backdrop-blur-sm lg:block`}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-brand-gold">{p.refine}</h2>
                {activeCount > 0 && (
                  <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="text-xs font-bold uppercase text-brand-muted hover:text-brand-gold">
                    {p.clearAll}
                  </button>
                )}
              </div>

              <label className="grid gap-1 text-xs text-brand-muted">
                {p.searchLabel}
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={p.searchPlaceholder}
                  className="w-full rounded border border-white/15 bg-black/20 p-2.5 text-sm text-brand-ivory placeholder:text-brand-sand/40"
                />
              </label>

              <fieldset className="space-y-2">
                <legend className="mb-2 text-xs text-brand-muted">{p.type}</legend>
                {propertyTypes.map((type) => {
                  const id = String(type.id);
                  return (
                    <label key={id} className="flex cursor-pointer items-center gap-3 text-sm text-brand-sand hover:text-brand-ivory">
                      <input type="checkbox" checked={selectedTypes.includes(id)} onChange={() => toggleType(id)} className="h-4 w-4 accent-[#D4AF37]" />
                      <DynamicIcon name={type.icon} className="h-4 w-4 text-brand-gold" />
                      {pick(type as unknown as Record<string, unknown>, "name")}
                    </label>
                  );
                })}
              </fieldset>

              <div className="grid gap-1 text-xs text-brand-muted">
                <span>{p.city}</span>
                <Select ariaLabel={p.city} value={filters.city} onChange={(value) => update({ city: value })} options={cityOptions} />
              </div>

              <fieldset>
                <legend className="mb-2 text-xs text-brand-muted">{p.operation}</legend>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 p-1">
                  {operationOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={filters.op === option.value}
                      onClick={() => update({ op: option.value })}
                      className={`rounded-md px-2 py-2 text-xs font-bold transition ${filters.op === option.value ? "bg-brand-gold text-brand-obsidian" : "text-brand-sand hover:bg-white/5"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid grid-cols-2 gap-3">
                <PriceField label={p.minPrice} value={filters.min} onCommit={(value) => update({ min: value })} />
                <PriceField label={p.maxPrice} value={filters.max} onCommit={(value) => update({ max: value })} />
              </div>

              <div className="grid gap-1 text-xs text-brand-muted">
                <span>{p.bedrooms}</span>
                <Select ariaLabel={p.bedrooms} value={filters.beds} onChange={(value) => update({ beds: value })} options={bedOptions} />
              </div>
            </div>
          </aside>

          <section aria-live="polite" aria-busy={loading}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm font-semibold text-brand-sand">
                {loading ? dict.common.loading : total !== null && !failed ? text(p.resultsCount, { count: number(total) }) : ""}
              </p>
              <div className="w-60 max-w-full">
                <Select size="sm" ariaLabel={p.sort} value={filters.sort} onChange={(value) => update({ sort: value })} options={sortOptions} />
              </div>
            </div>

            {failed && (
              <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-8 text-center">
                <p className="mb-4 text-red-100">{p.loadError}</p>
                <button type="button" onClick={() => setAttempt((value) => value + 1)} className="rounded bg-brand-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-obsidian">
                  {dict.common.retry}
                </button>
              </div>
            )}

            {loading && !failed && (
              <div className="grid gap-8 sm:grid-cols-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="animate-pulse overflow-hidden rounded-xl border border-white/10 bg-brand-obsidian/60">
                    <div className="aspect-[4/3] bg-white/5" />
                    <div className="space-y-3 p-5">
                      <div className="h-5 w-3/4 rounded bg-white/10" />
                      <div className="h-3 w-1/2 rounded bg-white/5" />
                      <div className="h-12 rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !failed && items.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
                <p className="mb-2 font-serif text-2xl font-bold text-brand-gold">{p.noResultsTitle}</p>
                <p className="mx-auto mb-6 max-w-md text-sm text-brand-muted">{p.noResultsText}</p>
                {activeCount > 0 && (
                  <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="rounded bg-brand-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-obsidian">
                    {p.clearFilters}
                  </button>
                )}
              </div>
            )}

            {!loading && !failed && items.length > 0 && (
              <>
                <div className="grid gap-8 sm:grid-cols-2">
                  {items.map((property, index) => (
                    <PropertyCard key={property.id} property={property} priority={index < 3} />
                  ))}
                </div>
                {lastPage > 1 && (
                  <nav className="mt-12 flex items-center justify-center gap-6" aria-label="Pagination">
                    <button type="button" disabled={filters.page <= 1} onClick={() => goToPage(filters.page - 1)} className="rounded border border-white/15 px-4 py-2 text-sm font-semibold text-brand-sand transition hover:border-brand-gold hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-40">
                      {p.previous}
                    </button>
                    <span className="text-sm text-brand-sand">{text(p.pageOf, { page: number(filters.page), total: number(lastPage) })}</span>
                    <button type="button" disabled={filters.page >= lastPage} onClick={() => goToPage(filters.page + 1)} className="rounded border border-white/15 px-4 py-2 text-sm font-semibold text-brand-sand transition hover:border-brand-gold hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-40">
                      {p.next}
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
