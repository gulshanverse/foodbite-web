import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good Food/i })).toBeVisible();
});

test("unauthenticated users are redirected from protected routes", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
});
