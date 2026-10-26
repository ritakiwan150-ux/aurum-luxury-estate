import { NextResponse } from "next/server";
import { backendFetch, clearSessionCookie, clientIp, readSessionToken, rejectCrossSite } from "@/src/lib/bff";

/**
 * Same-origin gateway to the Laravel API. The browser calls /api/backend/<path>; the session cookie is
 * turned into a Bearer token here, so page scripts never see it.
 */

// Session endpoints are handled by /api/auth/*; blocking them here guarantees a token is never returned.
const BLOCKED_FIRST_SEGMENTS = new Set(["login", "register", "logout"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;

  if (path.some((segment) => segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\"))) {
    return NextResponse.json({ message: "Invalid path." }, { status: 400 });
  }
  if (BLOCKED_FIRST_SEGMENTS.has(path[0])) return NextResponse.json({ message: "Not found." }, { status: 404 });

  if (!SAFE_METHODS.has(request.method)) {
    const blocked = rejectCrossSite(request);
    if (blocked) return blocked;
  }

  const token = readSessionToken(request);
  const incoming = new URL(request.url);
  const target = `/${path.map(encodeURIComponent).join("/")}${incoming.search}`;

  const hasBody = !SAFE_METHODS.has(request.method);
  const contentType = request.headers.get("content-type");

  const upstream = await backendFetch(target, {
    method: request.method,
    token,
    ip: clientIp(request),
    headers: contentType ? { "Content-Type": contentType } : undefined,
    body: hasBody ? request.body : undefined,
    // Streaming request bodies (image uploads) require half-duplex mode.
    ...(hasBody ? { duplex: "half" } : {}),
  } as Parameters<typeof backendFetch>[1]).catch(() => null);

  if (!upstream) return NextResponse.json({ message: "The service is unavailable." }, { status: 502 });

  const headers = new Headers({ "Cache-Control": "no-store" });
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) headers.set("Content-Type", upstreamType);

  const response = new NextResponse(upstream.body, { status: upstream.status, headers });
  if (upstream.status === 401 && token) clearSessionCookie(response); // the token expired: sign the visitor out
  return response;
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
