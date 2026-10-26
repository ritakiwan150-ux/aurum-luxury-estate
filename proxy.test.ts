import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const visit = (path: string, headers: Record<string, string> = {}) => proxy(new NextRequest(`http://localhost:3000${path}`, { headers }));
const target = (response: Response) => response.headers.get("location");

describe("language redirect (proxy.ts)", () => {
  it("sends Arabic browsers to /ar and English browsers to /en", () => {
    expect(target(visit("/", { "accept-language": "ar-AE,ar;q=0.9,en;q=0.5" }))).toBe("http://localhost:3000/ar");
    expect(target(visit("/", { "accept-language": "en-US,en;q=0.9" }))).toBe("http://localhost:3000/en");
  });
  it("respects q-values", () => {
    expect(target(visit("/", { "accept-language": "en;q=0.4,ar;q=0.9" }))).toBe("http://localhost:3000/ar");
  });
  it("falls back to Arabic for unsupported languages", () => {
    expect(target(visit("/", { "accept-language": "fr-FR" }))).toBe("http://localhost:3000/ar");
    expect(target(visit("/"))).toBe("http://localhost:3000/ar");
  });
  it("the saved NEXT_LOCALE cookie wins over the browser language", () => {
    expect(target(visit("/", { "accept-language": "ar", cookie: "NEXT_LOCALE=en" }))).toBe("http://localhost:3000/en");
  });
  it("keeps the path and query string", () => {
    expect(target(visit("/properties?op=rent", { "accept-language": "en" }))).toBe("http://localhost:3000/en/properties?op=rent");
  });
  it("does not redirect paths that already have a language", () => {
    expect(visit("/ar/about").headers.get("location")).toBeNull();
    expect(visit("/en").headers.get("location")).toBeNull();
  });
});
