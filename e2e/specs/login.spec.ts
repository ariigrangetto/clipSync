import { test, expect } from '@playwright/test';

test("has all the logins elements", async ({ page }) => {
    await page.goto("http://localhost:5173/login");

    await expect(page).toHaveTitle(/ClipSync/);
    await expect(page.getByText(/Capture and sync without passwords/)).toBeVisible();
    await expect(page.getByText(/Save web page selections and sync your devices without forms or passwords./)).toBeVisible();

    await expect(page.getByRole("button", { name: "Create a new instant space" })).toBeVisible();
    await expect(page.getByText(/It will generate a unique random code to start immediately./)).toBeVisible();

    await expect(page.getByText(/Space code or token:/)).toBeVisible();
    await page.getByLabel(/Space code or token:/).fill("clip_879a0f6f");

    await expect(page.getByText(/No Registration/)).toBeVisible();
    await expect(page.getByText(/Multi-device/)).toBeVisible();
    await expect(page.getByText(/Extension Web/)).toBeVisible();

    await page.getByRole("button", { name: "Enter my space" }).click();
});