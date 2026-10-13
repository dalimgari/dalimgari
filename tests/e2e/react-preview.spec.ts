import { expect, test } from "@playwright/test";

test("isolated React preview renders the community shell", async ({ page }) => {
  await page.goto("/react-preview.html");
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.getByRole("heading", { name: "ডালিমগাড়ী কমিউনিটি" })).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});
