import { expect, test } from "@playwright/test";

test("browse, filter and open a property", async ({ page }) => {
  await page.goto("/en/properties");
  await expect(page.getByRole("heading", { name: "The Collection" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Villa 1/ }).first()).toBeVisible();

  // Filters live in the URL so a filtered search can be shared.
  await page.getByRole("searchbox").fill("marina");
  await expect(page).toHaveURL(/q=marina/);

  await page.goto("/en/properties/palm-villa");
  await expect(page.getByRole("heading", { level: 1, name: "Villa 1" })).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  await expect(page).toHaveTitle(/Villa 1/);
});

test("an unknown property shows the localized 404", async ({ page }) => {
  const response = await page.goto("/ar/properties/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("الصفحة غير موجودة")).toBeVisible();
});

test("sending an inquiry shows a confirmation", async ({ page }) => {
  await page.goto("/en/properties/palm-villa");
  await page.getByLabel("Full name").fill("Test Visitor");
  await page.getByLabel("Phone number").fill("0500000000");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Thank you" })).toBeVisible();
});

test("the mobile menu opens and navigates", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile viewport only");
  await page.goto("/en");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/en\/about$/);
});
