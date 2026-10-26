import { CSSProperties, RefObject, useEffect } from "react";

/** Fixed-position style that anchors a popover under (or above) its trigger. */
export function anchoredStyle(
  trigger: HTMLElement,
  options: { minWidth?: number; maxHeight?: number } = {},
): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const maxHeight = options.maxHeight ?? 288;
  const gap = 6;
  const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
  const spaceAbove = rect.top - gap - 8;
  const placeAbove = spaceBelow < Math.min(maxHeight, 200) && spaceAbove > spaceBelow;
  const width = Math.min(Math.max(rect.width, options.minWidth ?? 0), window.innerWidth - 16);
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
  const available = placeAbove ? spaceAbove : spaceBelow;

  const style: CSSProperties = {
    position: "fixed",
    left,
    width,
    maxHeight: Math.max(120, Math.min(maxHeight, available)),
  };
  if (placeAbove) style.bottom = window.innerHeight - rect.top + gap;
  else style.top = rect.bottom + gap;
  return style;
}

/** Closes a popover on outside click, Escape, page scroll or resize. */
export function useDismiss(
  open: boolean,
  onClose: () => void,
  triggerRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const inside = (target: EventTarget | null) =>
      target instanceof Node &&
      Boolean(triggerRef.current?.contains(target) || popoverRef.current?.contains(target));

    const onPointerDown = (event: MouseEvent) => {
      if (!inside(event.target)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onScroll = (event: Event) => {
      if (!inside(event.target)) onClose();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [open, onClose, triggerRef, popoverRef]);
}
