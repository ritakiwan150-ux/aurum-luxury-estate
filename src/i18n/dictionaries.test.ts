import { describe, expect, it } from "vitest";
import en from "./dictionaries/en";
import ar from "./dictionaries/ar";
import dashAr from "./dash-ar";

const flatten = (value: unknown, prefix = ""): Record<string, string> =>
  Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "string" ? { ...acc, [path]: child } : { ...acc, ...flatten(child, path) };
  }, {});

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join(",");

describe("site dictionaries", () => {
  const english = flatten(en);
  const arabic = flatten(ar);

  it("Arabic has exactly the same keys as English", () => {
    expect(Object.keys(arabic).sort()).toEqual(Object.keys(english).sort());
  });
  it("no text is empty", () => {
    for (const [key, text] of [...Object.entries(english), ...Object.entries(arabic)]) expect(text.trim(), key).not.toBe("");
  });
  it("placeholders match between the languages", () => {
    for (const key of Object.keys(english)) expect(placeholders(arabic[key]), key).toBe(placeholders(english[key]));
  });
  it("Arabic text really is Arabic where it should be", () => {
    for (const key of ["common.loading", "nav.signIn", "home.eyebrow", "footer.about"]) expect(arabic[key], key).toMatch(/[\u0600-\u06FF]/);
  });
});

describe("dashboard Arabic dictionary", () => {
  it("keeps {placeholders} identical to the English key", () => {
    for (const [key, text] of Object.entries(dashAr)) expect(placeholders(text), key).toBe(placeholders(key));
  });
  it("has no empty translations", () => {
    for (const [key, text] of Object.entries(dashAr)) expect(text.trim(), key).not.toBe("");
  });
});
