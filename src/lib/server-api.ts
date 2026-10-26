import type { ApiNamedItem, ApiProperty } from "./api";
import { resolveApiBase } from "./api-url";

// Server-side requests may use a private URL (e.g. an internal network address).
const BASE_URL = resolveApiBase();

export interface ServerResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

async function getJson<T>(path: string, revalidate: number): Promise<ServerResult<T>> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    });
    if (!response.ok) return { ok: false, status: response.status, data: null };
    return { ok: true, status: response.status, data: (await response.json()) as T };
  } catch {
    // API unreachable (for example while building without the backend running).
    return { ok: false, status: 0, data: null };
  }
}

export const getProperty = (slug: string) =>
  getJson<{ property: ApiProperty }>(`/properties/${encodeURIComponent(slug)}`, 60);

export const getProperties = (query = "") =>
  getJson<{ data: ApiProperty[]; current_page: number; last_page: number; total?: number }>(`/properties${query}`, 60);

export const getCities = () => getJson<{ cities: ApiNamedItem[] }>("/cities", 300);

export const getPropertyTypes = () => getJson<{ property_types: ApiNamedItem[] }>("/property-types", 300);
