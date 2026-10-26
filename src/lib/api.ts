import { Property } from "../types";
import { resolveApiBase } from "./api-url";

export const API_BASE_URL = resolveApiBase();

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  is_active?: boolean;
  broker_license_number?: string | null;
  broker_verification_status?: string;
  roles?: Array<{ id: number; name: string }>;
}

export interface ApiProperty {
  id: number;
  slug: string;
  title_ar?: string | null;
  title_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  original_language?: "ar" | "en";
  operation: "rent" | "sale";
  price: number | string;
  area: number | string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  district?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: string;
  rejection_reason?: string | null;
  views_count?: number;
  is_featured?: boolean;
  type_id: number;
  city_id: number;
  type?: { id: number; name_ar: string; name_en: string };
  city?: { id: number; name_ar: string; name_en: string };
  images?: Array<{ id: number; image_path: string; is_primary: boolean }>;
  amenities?: Array<{ id: number; name_ar: string; name_en: string; icon?: string | null }>;
}

export interface ApiInquiry {
  id: number;
  property_id: number;
  name: string;
  phone: string;
  message: string;
  status: "new" | "contacted" | "closed";
  created_at?: string;
  property?: {
    id?: number;
    title_ar?: string;
    title_en?: string;
    slug?: string;
  };
}

export interface AnalyticsPoint {
  date: string;
  count: number;
}

export interface AdminAnalytics {
  generated_at: string;
  days: number;
  kpis: {
    properties: { total: number; published: number; pending: number; rejected: number; featured: number; views: number };
    users: { total: number; active: number; recent: number; previous: number; pending_brokers: number };
    inquiries: { total: number; unanswered: number; recent: number; previous: number };
  };
  inquiries_by_day: AnalyticsPoint[];
  users_by_day: AnalyticsPoint[];
  properties_by_status: Record<string, number>;
  inquiries_by_status: Record<string, number>;
  users_by_role: Record<string, number>;
  properties_by_type: Array<{ name_ar: string; name_en: string; count: number }>;
  properties_by_city: Array<{ name_ar: string; name_en: string; count: number }>;
  top_properties: Array<{ id: number; slug: string; title_ar: string | null; title_en: string | null; views: number; inquiries: number }>;
}

export interface ApiNamedItem {
  id: number;
  name_ar: string;
  name_en: string;
  icon?: string | null;
  is_active?: boolean;
}

interface ApiRequestOptions extends RequestInit {
  token?: string | null;
}

/** Fired when the gateway answers 401 for a signed-in visitor (session expired or revoked). */
export const UNAUTHORIZED_EVENT = "aurum:unauthorized";

/**
 * Marker used by the UI to mean "a session cookie exists". The real API token is stored in an
 * httpOnly cookie that JavaScript cannot read; it is attached by the Next.js gateway (/api/backend).
 */
export const SESSION_MARKER = "cookie-session";

const IS_BROWSER = typeof window !== "undefined";
/** In the browser every call goes to our own origin; on the server it goes straight to Laravel. */
const GATEWAY_BASE = "/api/backend";

async function send<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, body, ...init } = options;
  const method = (init.method ?? "GET").toUpperCase();
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      // Server-side calls may authenticate with a token; browsers rely on the httpOnly cookie.
      ...(!IS_BROWSER && token ? { Authorization: `Bearer ${token}` } : {}),
      // Custom header: cross-site pages cannot send it, which is part of our CSRF protection.
      ...(IS_BROWSER && method !== "GET" ? { "X-Requested-With": "aurum" } : {}),
      ...headers,
    },
    body,
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (IS_BROWSER && response.status === 401 && token) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    const data = payload as { message?: string; errors?: Record<string, string[]> } | null;
    const details = data?.errors ? Object.values(data.errors).flat().join(" ") : undefined;
    throw new ApiError(details || data?.message || `Request failed (${response.status})`, response.status);
  }
  return payload as T;
}

function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return send<T>(`${IS_BROWSER ? GATEWAY_BASE : API_BASE_URL}${path}`, options);
}

/** Sign-in endpoints live in the Next.js server so the token can be turned into a cookie. */
function authRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return send<T>(`/api/auth${path}`, options);
}

function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function mapApiProperty(property: ApiProperty): Property {
  const title =
    (property.original_language === "ar"
      ? property.title_ar
      : property.title_en) ||
    property.title_en ||
    property.title_ar ||
    "Property";
  const description =
    (property.original_language === "ar"
      ? property.description_ar
      : property.description_en) ||
    property.description_en ||
    property.description_ar ||
    "";
  const area = Number(property.area);

  return {
    id: String(property.id),
    apiId: property.id,
    slug: property.slug,
    title,
    price: Number(property.price),
    priceFormatted: `AED ${Number(property.price).toLocaleString("en-US")}`,
    location: [property.district, property.city?.name_en]
      .filter(Boolean)
      .join(", "),
    postcode: property.city?.name_en || "",
    beds: property.bedrooms || 0,
    baths: property.bathrooms || 0,
    area: `${area.toLocaleString("en-US")} sqft`,
    image:
      property.images?.find((image) => image.is_primary)?.image_path ||
      property.images?.[0]?.image_path ||
      "/images/property-placeholder.svg",
    type: property.type?.name_en || "Property",
    typeId: property.type_id,
    cityId: property.city_id,
    isExclusive: Boolean(property.is_featured),
    tag: property.is_featured ? "Exclusive" : undefined,
    description,
    amenities: property.amenities?.map((amenity) => amenity.name_en) || [],
  };
}

export const api = {
  properties(params: Record<string, string | number | undefined> = {}) {
    return request<{
      data: ApiProperty[];
      current_page: number;
      last_page: number;
      total?: number;
    }>(`/properties${queryString(params)}`);
  },
  property(slug: string) {
    return request<{ property: ApiProperty }>(
      `/properties/${encodeURIComponent(slug)}`,
    );
  },
  propertyTypes() {
    return request<{ property_types: ApiNamedItem[] }>("/property-types");
  },
  cities() {
    return request<{ cities: ApiNamedItem[] }>("/cities");
  },
  amenities() {
    return request<{ amenities: ApiNamedItem[] }>("/amenities");
  },
  publicSettings() {
    return request<{ settings: Record<string, string | null> }>("/settings/public");
  },
  submitInquiry(
    propertyId: number,
    data: { name: string; phone: string; message: string },
    token?: string | null,
  ) {
    return request<{ inquiry: ApiInquiry }>(
      `/properties/${propertyId}/inquiries`,
      {
        method: "POST",
        token,
        body: JSON.stringify(data),
      },
    );
  },
  login(data: { email: string; password: string }) {
    return authRequest<{ user: ApiUser }>("/login", { method: "POST", body: JSON.stringify(data) });
  },
  register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: "client" | "owner";
    broker_license_number?: string;
  }) {
    return authRequest<{ user: ApiUser }>("/register", { method: "POST", body: JSON.stringify(data) });
  },
  /** Current visitor (null when signed out), read from the session cookie. */
  session() {
    return authRequest<{ user: ApiUser | null }>("/session");
  },
  me(token: string) {
    return request<{ user: ApiUser }>("/me", { token });
  },
  updateProfile(data: { name: string }, token: string) {
    return request<{ user: ApiUser }>("/profile", {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    });
  },
  changePassword(
    data: {
      current_password: string;
      password: string;
      password_confirmation: string;
    },
    token: string,
  ) {
    return request<{ message: string }>("/password", {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    });
  },
  myInquiries(token: string) {
    return request<{ inquiries: ApiInquiry[] }>("/my-inquiries", { token });
  },
  logout() {
    return authRequest<{ message: string }>("/logout", { method: "POST" });
  },
  favorites(token: string) {
    return request<{ favorites: Array<{ property: ApiProperty }> }>(
      "/favorites",
      { token },
    );
  },
  addFavorite(propertyId: number, token: string) {
    return request(`/favorites/${propertyId}`, { method: "POST", token });
  },
  removeFavorite(propertyId: number, token: string) {
    return request(`/favorites/${propertyId}`, { method: "DELETE", token });
  },
  ownerInquiries(token: string) {
    return request<{ inquiries: ApiInquiry[] }>("/owner/inquiries", { token });
  },
  ownerProperties(token: string) {
    return request<{ properties: ApiProperty[] }>("/owner/properties", {
      token,
    });
  },
  createProperty(
    data: Record<string, string | number | number[] | null>,
    token: string,
  ) {
    return request<{ property: ApiProperty }>("/owner/properties", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },
  updateProperty(
    id: number,
    data: Record<string, string | number | number[] | null>,
    token: string,
  ) {
    return request<{ property: ApiProperty }>(`/owner/properties/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    });
  },
  uploadPropertyImages(id: number, images: File[], token: string) {
    const formData = new FormData();
    images.forEach((image) => formData.append("images[]", image));
    return request<{ images: ApiProperty["images"] }>(
      `/owner/properties/${id}/images`,
      {
        method: "POST",
        token,
        body: formData,
      },
    );
  },
  deleteProperty(id: number, token: string) {
    return request(`/owner/properties/${id}`, { method: "DELETE", token });
  },
  adminAnalytics(token: string) {
    return request<AdminAnalytics>("/admin/analytics", { token });
  },
  adminStats(token: string) {
    return request<Record<string, unknown>>("/admin/stats", { token });
  },
  adminPendingProperties(token: string) {
    return request<{ data: ApiProperty[] }>("/admin/properties/pending", {
      token,
    });
  },
  adminPropertyAction(
    id: number,
    action: "approve" | "reject" | "toggle-featured",
    token: string,
    rejectionReason?: string,
  ) {
    return request(`/admin/properties/${id}/${action}`, {
      method: "PUT",
      token,
      body:
        action === "reject"
          ? JSON.stringify({ rejection_reason: rejectionReason })
          : undefined,
    });
  },
  adminUsers(token: string) {
    return request<{
      data: Array<ApiUser & { roles?: Array<{ name: string }> }>;
    }>("/admin/users", { token });
  },
  adminUserAction(
    id: number,
    action: "toggle-status" | "assign-role" | "verify-broker" | "reject-broker",
    token: string,
    body?: Record<string, string>,
  ) {
    return request(`/admin/users/${id}/${action}`, {
      method: "PUT",
      token,
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  adminItems(
    resource: "property-types" | "cities" | "amenities",
    token: string,
  ) {
    return request<Record<string, ApiNamedItem[]>>(`/admin/${resource}`, {
      token,
    });
  },
  adminCreateItem(
    resource: "property-types" | "cities" | "amenities",
    data: Record<string, string>,
    token: string,
  ) {
    return request(`/admin/${resource}`, {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },
  adminUpdateItem(
    resource: "property-types" | "cities" | "amenities",
    id: number,
    data: Record<string, string | boolean>,
    token: string,
  ) {
    return request(`/admin/${resource}/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    });
  },
  adminDeleteItem(
    resource: "property-types" | "cities" | "amenities",
    id: number,
    token: string,
  ) {
    return request(`/admin/${resource}/${id}`, { method: "DELETE", token });
  },
  adminInquiries(token: string) {
    return request<{ data: ApiInquiry[] }>("/admin/inquiries", { token });
  },
  adminUpdateInquiry(id: number, status: ApiInquiry["status"], token: string) {
    return request(`/admin/inquiries/${id}/status`, {
      method: "PUT",
      token,
      body: JSON.stringify({ status }),
    });
  },
  adminSettings(token: string) {
    return request<{
      settings: Array<{ key: string; value: string | null; group?: string }>;
    }>("/admin/settings", { token });
  },
  adminUpdateSettings(
    settings: Array<{ key: string; value: string }>,
    token: string,
  ) {
    return request("/admin/settings", {
      method: "PUT",
      token,
      body: JSON.stringify({ settings }),
    });
  },
  adminActivityLogs(token: string) {
    return request<{
      data: Array<{
        id: number;
        action: string;
        description?: string;
        created_at?: string;
        admin?: { name: string };
      }>;
    }>("/admin/activity-logs", { token });
  },
};
