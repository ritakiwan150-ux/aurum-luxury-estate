/**
 * Server-side helpers for the "backend for frontend" layer.
 *
 * The Laravel API token never reaches the browser: it lives in an httpOnly cookie that only
 * these route handlers can read, and they attach it to the requests they forward to Laravel.
 */
import { NextResponse } from "next/server";
import { resolveApiBase } from "./api-url";

const isProduction = process.env.NODE_ENV === "production";

/** `__Host-` cookies must be Secure, path=/ and have no Domain, which browsers enforce. */
export const SESSION_COOKIE = isProduction ? "__Host-aurum_session" : "aurum_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // keep in step with SANCTUM_EXPIRATION

/** Laravel base URL, ending in /api. Prefer the private API_INTERNAL_URL in production. */
export function backendUrl(): string {
  return resolveApiBase();
}

export function readSessionToken(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join("=")) || null;
  }
  return null;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: isProduction, sameSite: "lax", path: "/", maxAge: 0 });
}

/** The visitor's IP as seen by this server (hosting platforms set x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * CSRF defence for state-changing requests, on top of the SameSite=Lax cookie:
 *  - a custom header that cross-site pages cannot add without a CORS pre-flight,
 *  - the browser's Sec-Fetch-Site / Origin headers must say "same site".
 * Returns a 403 response to send back, or null when the request is fine.
 */
export function rejectCrossSite(request: Request): NextResponse | null {
  const deny = () => NextResponse.json({ message: "Cross-site request blocked." }, { status: 403 });

  if (request.headers.get("x-requested-with") !== "aurum") return deny();

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return deny();

  const origin = request.headers.get("origin");
  if (origin) {
    const expectedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      return deny();
    }
    if (!expectedHost || originHost !== expectedHost) return deny();
  }
  return null;
}

/** Forward only what the browser needs from a Laravel error (never internals). */
export async function relayError(upstream: Response): Promise<NextResponse> {
  const payload = (await upstream.json().catch(() => null)) as { message?: unknown; errors?: unknown } | null;
  return NextResponse.json(
    {
      message: typeof payload?.message === "string" ? payload.message : `Request failed (${upstream.status})`,
      ...(payload?.errors && typeof payload.errors === "object" ? { errors: payload.errors } : {}),
    },
    { status: upstream.status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function backendFetch(path: string, init: RequestInit & { token?: string | null; ip?: string }): Promise<Response> {
  const { token, ip, headers, ...rest } = init;
  return fetch(`${backendUrl()}${path}`, {
    ...rest,
    cache: "no-store",
    redirect: "manual",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(ip ? { "X-Forwarded-For": ip } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  });
}
