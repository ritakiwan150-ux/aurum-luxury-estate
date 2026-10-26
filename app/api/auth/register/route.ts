import { NextResponse } from "next/server";
import { backendFetch, clientIp, rejectCrossSite, relayError, setSessionCookie } from "@/src/lib/bff";

const FIELDS = ["name", "email", "password", "password_confirmation", "role", "broker_license_number"] as const;

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "Invalid request." }, { status: 422 });

  // Forward only the fields the API understands.
  const payload = Object.fromEntries(FIELDS.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));

  const upstream = await backendFetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ip: clientIp(request),
  }).catch(() => null);

  if (!upstream) return NextResponse.json({ message: "The service is unavailable." }, { status: 502 });
  if (!upstream.ok) return relayError(upstream);

  const data = (await upstream.json()) as { user: unknown; token: string };
  const response = NextResponse.json({ user: data.user }, { status: 201, headers: { "Cache-Control": "no-store" } });
  setSessionCookie(response, data.token);
  return response;
}
