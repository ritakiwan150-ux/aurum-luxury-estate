import { expect, test } from "@playwright/test";

test("sign in keeps the token out of reach of page scripts, and sign out ends the session", async ({ page, context }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("client@example.com");
  await page.getByLabel("Password").fill("password1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/account$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Test Client");

  // The session cookie exists, is httpOnly and is invisible to JavaScript.
  const cookie = (await context.cookies()).find((c) => c.name.endsWith("aurum_session"));
  expect(cookie?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("aurum_session");
  expect(await page.evaluate(() => Object.keys(window.localStorage).filter((key) => key.includes("token")))).toEqual([]);

  // Signing out clears the session for good, even after a reload.
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.goto("/en/account");
  await expect(page).toHaveURL(/\/en\/login/);
});

test("wrong credentials show an error and no session", async ({ page, context }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("client@example.com");
  await page.getByLabel("Password").fill("wrong-password1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect((await context.cookies()).some((c) => c.name.endsWith("aurum_session"))).toBe(false);
});

test("protected pages redirect visitors to the sign-in page", async ({ page }) => {
  await page.goto("/ar/favorites");
  await expect(page).toHaveURL(/\/ar\/login\?next=/);
});
