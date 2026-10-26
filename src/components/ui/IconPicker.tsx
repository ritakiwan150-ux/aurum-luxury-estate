"use client";

import { CSSProperties, useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { DynamicIcon, ICON_OPTIONS, IconGroup, getIconOption } from "./icons";
import { anchoredStyle, useDismiss } from "./popover";

interface IconPickerProps {
  /** Icon key stored in the database (empty string = no icon). */
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

const GROUPS: IconGroup[] = ["Property", "Amenities", "General"];

export default function IconPicker({ value, onChange, ariaLabel, className = "" }: IconPickerProps) {
  const { t } = useI18n();
  const label = ariaLabel ?? t("Choose icon");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const [query, setQuery] = useState("");

  const open = position !== null;
  const close = useCallback(() => setPosition(null), []);
  useDismiss(open, close, triggerRef, panelRef);

  const current = getIconOption(value);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ICON_OPTIONS.filter((option) => !needle || option.key.includes(needle) || option.label.toLowerCase().includes(needle) || t(option.label).toLowerCase().includes(needle));
  }, [query, t]);

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    if (!triggerRef.current) return;
    setQuery("");
    setPosition(anchoredStyle(triggerRef.current, { minWidth: 320, maxHeight: 380 }));
  };

  const pick = (key: string) => {
    onChange(key);
    close();
    triggerRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className={`flex w-full items-center justify-between gap-2 rounded border bg-brand-obsidian p-2.5 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold/60 ${open ? "border-brand-gold" : "border-white/15 hover:border-brand-gold/50"}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {current ? (
            <DynamicIcon name={value} className="h-5 w-5 shrink-0 text-brand-gold" />
          ) : (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-dashed border-white/30 text-[11px] text-brand-muted">+</span>
          )}
          <span className={`truncate ${value ? "" : "text-brand-muted"}`}>{current ? t(current.label) : value || t("Choose icon")}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-brand-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={t("Icon library")}
            style={position}
            className="z-[100] flex flex-col overflow-hidden rounded-lg border border-brand-gold/30 bg-brand-obsidian shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-white/10 p-2">
              <Search className="ml-1 h-4 w-4 shrink-0 text-brand-muted" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Search icons…")}
                aria-label={t("Search icons")}
                className="min-w-0 flex-1 bg-transparent p-1 text-sm outline-none placeholder:text-brand-sand/40"
              />
              {value && (
                <button type="button" onClick={() => pick("")} className="flex shrink-0 items-center gap-1 rounded border border-white/15 px-2 py-1 text-xs text-brand-sand hover:border-red-300/40 hover:text-red-200">
                  <X className="h-3 w-3" aria-hidden="true" /> {t("No icon")}
                </button>
              )}
            </div>
            <div className="overflow-auto p-2">
              {visible.length === 0 && <p className="p-3 text-sm text-brand-muted">{t("No icons match “{query}”.", { query })}</p>}
              {GROUPS.map((group) => {
                const items = visible.filter((option) => option.group === group);
                if (!items.length) return null;
                return (
                  <section key={group} className="mb-3 last:mb-0">
                    <h4 className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-widest text-brand-muted">{t(group)}</h4>
                    <div className="grid grid-cols-6 gap-1">
                      {items.map((option) => {
                        const selected = option.key === value;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            title={t(option.label)}
                            aria-label={t(option.label)}
                            aria-pressed={selected}
                            onClick={() => pick(option.key)}
                            className={`flex h-10 items-center justify-center rounded-md border transition ${selected ? "border-brand-gold bg-brand-gold text-brand-obsidian" : "border-transparent text-brand-sand hover:border-brand-gold/50 hover:bg-brand-gold/10"}`}
                          >
                            <option.Icon className="h-5 w-5" aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
