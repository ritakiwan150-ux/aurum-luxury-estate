/**
 * The one place that decides where the Laravel API lives (server side only; browsers use the gateway).
 * Accepts both "http://host:8000" and "http://host:8000/api" and always returns the form ending in /api.
 */
export function resolveApiBase(): string {
  const raw = (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").trim().replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}
