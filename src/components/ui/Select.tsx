"use client";

import { CSSProperties, KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { DynamicIcon } from "./icons";
import { anchoredStyle, useDismiss } from "./popover";

export interface SelectOption {
  value: string;
  label: string;
  /** Icon key from ./icons (e.g. "building-2"). */
  icon?: string | null;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  required?: boolean;
  disabled?: boolean;
  /** "sm" is the compact version used inside rows and tables. */
  size?: "md" | "sm";
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  required,
  disabled,
  size = "md",
  className = "",
}: SelectProps) {
  const { t } = useI18n();
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const [active, setActive] = useState(0);

  const open = position !== null;
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const close = useCallback(() => setPosition(null), []);
  useDismiss(open, close, triggerRef, listRef);

  useEffect(() => {
    if (open) document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, id]);

  const openList = () => {
    if (disabled || !triggerRef.current) return;
    setPosition(anchoredStyle(triggerRef.current, { minWidth: size === "sm" ? 168 : 0 }));
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    close();
    triggerRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((index) => Math.min(options.length - 1, index + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(0, index - 1));
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Tab":
        close();
        break;
    }
  };

  const triggerSize = size === "sm" ? "px-2.5 py-2 text-xs" : "p-3 text-sm";

  return (
    <div className={`relative ${className}`}>
      {/* Hidden input so native `required` validation still works on forms. */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          disabled={disabled}
          value={value}
          onChange={() => undefined}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded border bg-brand-obsidian text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold/60 disabled:cursor-not-allowed disabled:opacity-50 ${triggerSize} ${open ? "border-brand-gold" : "border-white/15 hover:border-brand-gold/50"}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <DynamicIcon name={selected?.icon} className="h-4 w-4 shrink-0 text-brand-gold" />
          <span className={`truncate ${selected ? "" : "text-brand-muted"}`}>{selected ? selected.label : (placeholder ?? t("Select…"))}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-brand-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            aria-label={ariaLabel}
            style={position}
            className="z-[100] overflow-auto rounded-lg border border-brand-gold/30 bg-brand-obsidian p-1 shadow-2xl"
          >
            {options.length === 0 && <li className="px-3 py-2 text-sm text-brand-muted">{t("No options available")}</li>}
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  id={`${id}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${index === active ? "bg-brand-gold/15" : ""} ${isSelected ? "text-brand-gold" : "text-brand-ivory"}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <DynamicIcon name={option.icon} className="h-4 w-4 shrink-0 text-brand-gold" />
                    <span className="truncate">{option.label}</span>
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
