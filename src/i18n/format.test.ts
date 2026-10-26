import { describe, expect, it } from "vitest";
import { formatNumber, formatPrice, interpolate, localized } from "./format";

describe("interpolate", () => {
  it("fills placeholders and leaves unknown ones visible", () => {
    expect(interpolate("Page {page} of {total}", { page: 2, total: 5 })).toBe("Page 2 of 5");
    expect(interpolate("Hello {name}", {})).toBe("Hello {name}");
  });
});

describe("number and price formatting", () => {
  it("uses Latin digits in both languages", () => {
    expect(formatNumber(1234567, "ar")).toMatch(/^[0-9,٬.]+$/);
    expect(formatNumber(1234567, "ar")).not.toMatch(/[٠-٩]/);
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
  });
  it("formats AED prices per language", () => {
    expect(formatPrice(8000, "en")).toContain("8,000");
    expect(formatPrice(8000, "en")).toContain("AED");
    expect(formatPrice(8000, "ar")).toContain("8,000");
    expect(formatPrice(8000, "ar")).toMatch(/د\.إ/);
  });
});

describe("localized", () => {
  const item = { title_en: "Villa", title_ar: "فيلا", name_en: "Dubai", name_ar: "" };
  it("returns the field for the language", () => {
    expect(localized(item, "title", "ar")).toBe("فيلا");
    expect(localized(item, "title", "en")).toBe("Villa");
  });
  it("falls back to the other language when empty, and to an empty string for nothing", () => {
    expect(localized(item, "name", "ar")).toBe("Dubai");
    expect(localized(null, "title", "ar")).toBe("");
    expect(localized({}, "title", "en")).toBe("");
  });
});
