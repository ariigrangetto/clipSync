import { test, expect } from "@playwright/test";

const mockedUser = {
    id: "e2e-user-id",
    aud: "authenticated",
    role: "authenticated",
    email: "e2e@example.com",
    app_metadata: { provider: "email" },
    user_metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

test.describe("ErrorPage E2E Tests", () => {
    test.beforeEach(async ({ page }) => {
        const validJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmUtdXNlci1pZCIsImVtYWlsIjoiZTJlQGV4YW1wbGUuY29tIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE1MTYyMzkwMjJ9.signature";

        await page.route(/\/auth\/v1\//i, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    access_token: validJwt,
                    token_type: "bearer",
                    expires_in: 3600,
                    expires_at: Math.floor(Date.now() / 1000) + 3600,
                    refresh_token: "fake-refresh-token",
                    user: mockedUser
                })
            });
        });

        await page.route(/\/rest\/v1\/Notes/i, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([])
            });
        });

        await page.addInitScript((mockedUser) => {
            const nowInSeconds = Math.floor(Date.now() / 1000);
            const validJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmUtdXNlci1pZCIsImVtYWlsIjoiZTJlQGV4YW1wbGUuY29tIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE1MTYyMzkwMjJ9.signature";
            const mockSession = {
                access_token: validJwt,
                token_type: "bearer",
                expires_in: 3600,
                expires_at: nowInSeconds + 3600,
                refresh_token: "fake-refresh-token",
                user: mockedUser
            };
            window.localStorage.setItem(
                "sb-cvevhxkurtobfubiwvpp-auth-token",
                JSON.stringify(mockSession)
            );
        }, mockedUser);
    });

    test("should display all basic elements when navigating to an unknown route", async ({ page }) => {
        await page.goto("http://localhost:5173/non-existent-route", { waitUntil: "domcontentloaded" });

        await expect(page).toHaveTitle(/ClipSync/);
        await expect(page.getByText("Knowledge Base")).toBeVisible();

        await expect(page.getByText("404")).toBeVisible();
        await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
        await expect(
            page.getByText("We're sorry, the page you are looking for does not exist or has been moved.")
        ).toBeVisible();

        await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();

        await expect(page.getByText(/All rights reserved/i)).toBeVisible();
    });

    test("should navigate back to the home page when clicking 'Return home'", async ({ page }) => {
        await page.goto("http://localhost:5173/error", { waitUntil: "domcontentloaded" });

        const returnHomeLink = page.getByRole("link", { name: "Return home" });
        await expect(returnHomeLink).toBeVisible();
        await returnHomeLink.click();

        await expect(page).toHaveURL("http://localhost:5173/");
    });
});