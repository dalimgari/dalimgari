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

test(
  "public custom-page route stays inside the preview and handles unavailable pages",
  async ({ page }) => {
    await page.goto("/react-preview.html#/pages/migration-test-page-that-does-not-exist");
    await expect(page).toHaveURL(/react-preview\.html#\/pages\//);
    await expect(page.getByRole("heading", { name: "Page unavailable" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
  },
);

test("public HTML sanitizer removes scripts, event handlers, and unsafe URLs", async ({ page }) => {
  await page.goto("/react-preview.html");
  const html = await page.evaluate(async () => {
    const { sanitizeHtml } = await import("/src/utils/sanitizeHtml.ts");
    return sanitizeHtml(
      '<h2 onclick="alert(1)">Safe heading</h2><script>alert(1)</script><a href="javascript:alert(1)">Unsafe link</a><img src="https://example.com/image.png" onerror="alert(1)">',
    );
  });
  expect(html).toContain("Safe heading");
  expect(html).not.toContain("<script");
  expect(html).not.toContain("onclick");
  expect(html).not.toContain("onerror");
  expect(html).not.toContain("javascript:");
  expect(html).toContain('src="https://example.com/image.png"');
});
