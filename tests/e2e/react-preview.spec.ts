import { expect, test } from "@playwright/test";

test("isolated React preview renders the community shell", async ({ page }) => {
  await page.goto("/react-preview.html");
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.getByRole("heading", { name: "ডালিমগাড়ী কমিউনিটি" })).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

test("account routes stay inside the preview hash router", async ({ page }) => {
  await page.goto("/react-preview.html");
  await page.getByRole("link", { name: "লগইন", exact: true }).first().click();
  await expect(page).toHaveURL(/react-preview\.html#\/login$/);
  await expect(page.getByRole("heading", { name: "লগইন" })).toBeVisible();
  await page.getByRole("link", { name: "পাসওয়ার্ড ভুলে গেছেন?" }).click();
  await expect(page).toHaveURL(/react-preview\.html#\/forgot-password$/);
  await expect(page.getByRole("heading", { name: "পাসওয়ার্ড পুনরুদ্ধার" })).toBeVisible();
});

test("unknown routes provide a recoverable not-found page", async ({ page }) => {
  await page.goto("/react-preview.html#/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "পেজ পাওয়া যায়নি" })).toBeVisible();
  await page.getByRole("link", { name: "হোমপেজে ফিরুন" }).click();
  await expect(page).toHaveURL(/react-preview\.html#\/$/);
});
