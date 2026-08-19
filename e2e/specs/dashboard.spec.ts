import { test, expect } from '@playwright/test';

test("has all the dashboard elements", async ({ page }) => {
    await page.goto("http://localhost:5173");

    await expect(page).toHaveTitle(/ClipSync/);
    await expect(page.getByText("Favorites")).toBeVisible();
    await expect(page.getByText("All Notes")).toBeVisible();
    await expect(page.getByText("Auto-save")).toBeVisible();
    await expect(page.getByText("Your User Token")).toBeVisible();
    await expect(page.getByText("Save this token to log in from another device or to sign in again without losing anything.")).toBeVisible();
    await expect(page.getByPlaceholder("Search notes, tags...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sync" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Note" })).toBeVisible();
});