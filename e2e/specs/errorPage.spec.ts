import { test, expect } from '@playwright/test';

test("hass all the error page elements", async ({ page }) => {
    await page.goto("http://localhost:5173/error");

    await expect(page).toHaveTitle(/ClipSync/);
    await expect(page.getByText("Knowledge Base")).toBeVisible();

    await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();

    await page.getByRole("button", { name: "Return home" });
    await expect(page.getByText(/All rights reserved./)).toBeVisible();
});