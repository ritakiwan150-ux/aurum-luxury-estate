import { NextResponse } from "next/server";
import { backendFetch, clearSessionCookie, clientIp, readSessionToken, rejectCrossSite } from "@/src/lib/bff";

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const token = readSessionToken(request);
  // Revoke the token on the server; the cookie is cleared even if Laravel is unreachable.
  if (token) await backendFetch("/logout", { method: "POST", token, ip: clientIp(request) }).catch(() => null);

  const response = NextResponse.json({ message: "Logged out." }, { headers: { "Cache-Control": "no-store" } });
  clearSessionCookie(response);
  return response;
}
