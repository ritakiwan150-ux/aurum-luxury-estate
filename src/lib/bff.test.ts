import { describe, expect, it } from "vitest";
import { clientIp, rejectCrossSite } from "./bff";

const req = (headers: Record<string, string>) => new Request("https://aurum.test/api/backend/x", { method: "POST", headers });

describe("rejectCrossSite (CSRF defence)", () => {
  it("allows same-origin requests that carry the custom header", () => {
    expect(rejectCrossSite(req({ "x-requested-with": "aurum", origin: "https://aurum.test", host: "aurum.test", "sec-fetch-site": "same-origin" }))).toBeNull();
  });
  it("blocks a missing custom header", () => {
    expect(rejectCrossSite(req({ origin: "https://aurum.test", host: "aurum.test" }))?.status).toBe(403);
  });
  it("blocks a foreign Origin and cross-site fetches", () => {
    expect(rejectCrossSite(req({ "x-requested-with": "aurum", origin: "https://evil.example", host: "aurum.test" }))?.status).toBe(403);
    expect(rejectCrossSite(req({ "x-requested-with": "aurum", "sec-fetch-site": "cross-site", host: "aurum.test" }))?.status).toBe(403);
    expect(rejectCrossSite(req({ "x-requested-with": "aurum", origin: "not a url", host: "aurum.test" }))?.status).toBe(403);
  });
  it("honours x-forwarded-host behind a proxy", () => {
    expect(rejectCrossSite(req({ "x-requested-with": "aurum", origin: "https://aurum.test", host: "internal:3000", "x-forwarded-host": "aurum.test" }))).toBeNull();
  });
});

describe("clientIp", () => {
  it("prefers the first x-forwarded-for entry", () => {
    expect(clientIp(new Request("https://a.test", { headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" } }))).toBe("203.0.113.5");
  });
  it("falls back to x-real-ip, then loopback", () => {
    expect(clientIp(new Request("https://a.test", { headers: { "x-real-ip": "198.51.100.2" } }))).toBe("198.51.100.2");
    expect(clientIp(new Request("https://a.test"))).toBe("127.0.0.1");
  });
});
