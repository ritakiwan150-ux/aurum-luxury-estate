"use client";

import { useEffect, useRef } from "react";

const FRAME_COUNT = 300;
const FRAME_EXT = process.env.NEXT_PUBLIC_SCROLL_FRAME_EXT || "jpg";
const MAX_CONCURRENT_LOADS = 4;
const EASING = 0.15;

function frameUrl(index: number) {
  return `/images/ezgif-frame-${String(index + 1).padStart(3, "0")}.${FRAME_EXT}`;
}

/**
 * Frames are fetched in passes (every 20th, then 10th, 5th, 2nd, then all) so
 * the scroll animation works almost immediately and gets smoother as the rest
 * arrives. Slow / data-saver / small screens stop at a coarser pass.
 */
function buildLoadOrder(): number[] {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  const slow = Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType ?? "");
  const small = window.innerWidth < 768;
  const strides = slow ? [20, 10] : small ? [20, 10, 5, 2] : [20, 10, 5, 2, 1];

  const seen = new Set<number>();
  const order: number[] = [];
  const add = (index: number) => {
    if (index >= 0 && index < FRAME_COUNT && !seen.has(index)) {
      seen.add(index);
      order.push(index);
    }
  };
  strides.forEach((stride, pass) => {
    for (let i = 0; i < FRAME_COUNT; i += stride) add(i);
    if (pass === 0) add(FRAME_COUNT - 1); // the last frame must exist early
  });
  return order;
}

export default function ScrollVideoBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const images: Array<HTMLImageElement | undefined> = new Array(FRAME_COUNT);
    let cancelled = false;
    let current = 0;
    let target = 0;
    let lastDrawn = -1;
    let needsRedraw = true;
    let rafId = 0;
    let cssWidth = 0;
    let cssHeight = 0;

    function nearestLoaded(index: number): HTMLImageElement | undefined {
      if (images[index]) return images[index];
      for (let offset = 1; offset < FRAME_COUNT; offset++) {
        const before = images[index - offset];
        if (before) return before;
        const after = images[index + offset];
        if (after) return after;
      }
      return undefined;
    }

    function draw(index: number) {
      const image = nearestLoaded(index);
      if (!image || !ctx) return;
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      const imageAspect = image.width / image.height;
      const containerAspect = cssWidth / cssHeight;
      let drawWidth: number;
      let drawHeight: number;
      if (containerAspect > imageAspect) {
        drawWidth = cssWidth;
        drawHeight = cssWidth / imageAspect;
      } else {
        drawHeight = cssHeight;
        drawWidth = cssHeight * imageAspect;
      }
      ctx.drawImage(image, (cssWidth - drawWidth) / 2, (cssHeight - drawHeight) / 2, drawWidth, drawHeight);
    }

    // Only animate while something is moving; stay idle otherwise.
    function requestRender() {
      needsRedraw = true;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function tick() {
      rafId = 0;
      const delta = target - current;
      current = Math.abs(delta) > 0.01 ? current + delta * EASING : target;
      const index = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(current)));
      if (needsRedraw || index !== lastDrawn) {
        draw(index);
        lastDrawn = index;
        needsRedraw = false;
      }
      if (Math.abs(target - current) > 0.01) rafId = requestAnimationFrame(tick);
    }

    function resizeCanvas() {
      if (!ctx) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Mobile browsers resize the viewport while the URL bar hides: ignore tiny height-only changes.
      if (cssWidth === width && Math.abs(cssHeight - height) < 120) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssWidth = width;
      cssHeight = height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      requestRender();
    }

    function updateScroll() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const fraction = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      target = fraction * (FRAME_COUNT - 1);
      requestRender();
    }

    // ---- progressive loader ----
    const order = reducedMotion ? [0] : buildLoadOrder();
    let cursor = 0;
    let active = 0;
    function pump() {
      while (!cancelled && active < MAX_CONCURRENT_LOADS && cursor < order.length) {
        const index = order[cursor++];
        active++;
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          active--;
          if (cancelled) return;
          images[index] = image;
          requestRender();
          pump();
        };
        image.onerror = () => {
          active--;
          pump();
        };
        image.src = frameUrl(index);
      }
    }

    resizeCanvas();
    pump();

    let resizeObserver: ResizeObserver | undefined;
    const onResize = () => {
      resizeCanvas();
      updateScroll();
    };
    if (!reducedMotion) {
      updateScroll();
      resizeObserver = new ResizeObserver(updateScroll);
      resizeObserver.observe(document.body);
      window.addEventListener("scroll", updateScroll, { passive: true });
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", updateScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 w-full h-full pointer-events-none"
    />
  );
}
