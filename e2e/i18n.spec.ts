import { expect, test } from "@playwright/test";

test.describe("language and direction", () => {
  test.use({ locale: "ar-AE" });

  test("an Arabic browser lands on /ar with right-to-left layout", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("the language switcher flips to English and back, keeping the page", async ({ page }) => {
    await page.goto("/ar/about");
    await page.getByRole("button", { name: /English/ }).first().click();
    await expect(page).toHaveURL(/\/en\/about$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.getByRole("button", { name: /العربية/ }).first().click();
    await expect(page).toHaveURL(/\/ar\/about$/);
  });
});

test("an English browser lands on /en", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});
