import { expect, test } from "@playwright/test";

test("isolated React preview renders the community shell", async ({ page }) => {
  await page.goto("/react-preview.html");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Dalimgari Community" })).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

test("account routes stay inside the preview hash router", async ({ page }) => {
  await page.goto("/react-preview.html");
  await page.getByRole("link", { name: "Login", exact: true }).first().click();
  await expect(page).toHaveURL(/react-preview\.html#\/login$/);
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/react-preview\.html#\/forgot-password$/);
  await expect(page.getByRole("heading", { name: "Password recovery" })).toBeVisible();
});

test("unknown routes provide a recoverable not-found page", async ({ page }) => {
  await page.goto("/react-preview.html#/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Return home" }).click();
  await expect(page).toHaveURL(/react-preview\.html#\/$/);
});
