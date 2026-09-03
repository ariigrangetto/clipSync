import { test, expect } from '@playwright/test';

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

test.describe("Dashboard page test", () => {
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

    test("Default dashboard elements", async ({ page }) => {
        await page.goto("http://localhost:5173");
        await expect(page).toHaveTitle(/ClipSync/);
        await expect(page.getByText("All Notes")).toBeVisible();
        await expect(page.getByText("Favorites")).toBeVisible();
        await expect(page.getByText("Auto-save")).toBeVisible();
        await expect(page.getByText("Authenticated User")).toBeVisible();
        await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
        await expect(page.getByPlaceholder("Search notes, tags...")).toBeVisible();
        await expect(page.getByRole("button", { name: "New Note" })).toBeVisible();
        await expect(page.getByText("All", { exact: true })).toBeVisible();
    });

    test("Dashboard without notes", async ({ page }) => {
        await page.goto("http://localhost:5173");

        await expect(page.getByText("There are no notes here yet")).toBeVisible();
        await expect(page.getByText("Select text anywhere on the web or create a note manually to get started")).toBeVisible();
        await expect(page.getByRole("button", { name: "+ New Manual Note" })).toBeVisible();
        await expect(page.getByText("0 notes")).toBeVisible();
    });

    test("dashboard with notes", async ({ page }) => {
        const mockNote = {
            id: "note-new-1",
            title: "First E2E Note",
            text: "This is the content of the first E2E note.",
            category: "article",
            tags: ["e2e", "test"],
            source: "Entrada manual",
            user_token: "e2e-user-id",
            created_at: new Date().toISOString(),
            favorite: false
        };

        await page.route(/\/rest\/v1\/Notes/i, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([mockNote])
            });
        });

        await page.goto("http://localhost:5173");

        await expect(page.getByRole("heading", { name: "First E2E Note" })).toBeVisible();
        await expect(page.getByText("This is the content of the first E2E note.")).toBeVisible();
        await expect(page.getByText("e2e", { exact: true })).toBeVisible();
        await expect(page.getByText("test", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "article" })).toBeVisible();
        await expect(page.getByText("Entrada manual")).toBeVisible();
    });
});
