import { NextResponse } from "next/server";
import { backendFetch, clearSessionCookie, clientIp, readSessionToken } from "@/src/lib/bff";

/** Who is signed in? Always 200, with `user: null` for visitors, so the browser console stays clean. */
export async function GET(request: Request) {
  const noStore = { "Cache-Control": "no-store" };
  const token = readSessionToken(request);
  if (!token) return NextResponse.json({ user: null }, { headers: noStore });

  const upstream = await backendFetch("/me", { token, ip: clientIp(request) }).catch(() => null);
  if (!upstream) return NextResponse.json({ message: "The service is unavailable." }, { status: 502, headers: noStore });

  if (upstream.status === 401) {
    const response = NextResponse.json({ user: null }, { headers: noStore }); // expired or revoked token
    clearSessionCookie(response);
    return response;
  }
  if (!upstream.ok) return NextResponse.json({ message: "Could not load the session." }, { status: 502, headers: noStore });

  const data = (await upstream.json()) as { user: unknown };
  return NextResponse.json({ user: data.user }, { headers: noStore });
}
