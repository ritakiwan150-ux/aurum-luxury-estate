import { NextResponse } from "next/server";
import { backendFetch, clientIp, rejectCrossSite, relayError, setSessionCookie } from "@/src/lib/bff";

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== "string" || typeof body?.password !== "string") {
    return NextResponse.json({ message: "Email and password are required." }, { status: 422 });
  }

  const upstream = await backendFetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
    ip: clientIp(request),
  }).catch(() => null);

  if (!upstream) return NextResponse.json({ message: "The service is unavailable." }, { status: 502 });
  if (!upstream.ok) return relayError(upstream);

  const data = (await upstream.json()) as { user: unknown; token: string };
  const response = NextResponse.json({ user: data.user }, { headers: { "Cache-Control": "no-store" } });
  setSessionCookie(response, data.token); // the token is NOT part of the JSON body
  return response;
}
