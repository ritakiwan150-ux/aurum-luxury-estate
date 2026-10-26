import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveApiBase } from "./api-url";

afterEach(() => vi.unstubAllEnvs());

describe("resolveApiBase", () => {
  it("adds /api when the address has none (the case that broke detail pages)", () => {
    vi.stubEnv("API_INTERNAL_URL", "http://127.0.0.1:8000");
    expect(resolveApiBase()).toBe("http://127.0.0.1:8000/api");
  });
  it("does not add it twice and ignores trailing slashes", () => {
    vi.stubEnv("API_INTERNAL_URL", "http://127.0.0.1:8000/api/");
    expect(resolveApiBase()).toBe("http://127.0.0.1:8000/api");
  });
  it("falls back to NEXT_PUBLIC_API_BASE_URL, then to localhost", () => {
    vi.stubEnv("API_INTERNAL_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
    expect(resolveApiBase()).toBe("https://api.example.com/api");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    expect(resolveApiBase()).toBe("http://127.0.0.1:8000/api");
  });
});
