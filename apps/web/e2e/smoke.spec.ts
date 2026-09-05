import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good Food/i })).toBeVisible();
});

test("public marketplace explore loads without login", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: /Good food, ready for pickup/i })).toBeVisible();
  await expect(page.getByRole("textbox", { name: /Search food or business/i })).toBeVisible();
});

test("unauthenticated users are redirected from protected routes", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
});
