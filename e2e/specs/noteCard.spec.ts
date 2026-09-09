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

test.describe("NoteCard Component with existing notes", () => {
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
            const mockNotes = [
                {
                    id: "note-1",
                    title: "Important Note",
                    text: "This is the complete content of the note for the detail view.",
                    category: "Article",
                    tags: ["e2e", "playwright"],
                    source: "https://example.com",
                    user_token: "e2e-user-id",
                    created_at: new Date().toISOString(),
                    is_favorite: false
                },
                {
                    id: "note-2",
                    title: "Second Example Note",
                    text: "Content of the second note.",
                    category: "Work",
                    tags: ["react"],
                    source: "Manual entry",
                    user_token: "e2e-user-id",
                    created_at: new Date().toISOString(),
                    is_favorite: true
                }
            ];

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(mockNotes)
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

    test("should display note details correctly when note exists", async ({ page }) => {
        await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
        await expect(page.getByText("Important Note")).toBeVisible();
        await expect(page.getByText("This is the complete content of the note for the detail view.")).toBeVisible();
        await expect(page.locator("span", { hasText: "Article" })).toBeVisible();
        await expect(page.locator(".note-card span", { hasText: "e2e" })).toBeVisible();
        await expect(page.locator(".note-card span", { hasText: "playwright" })).toBeVisible();
        await expect(page.getByText("https://example.com")).toBeVisible();

        await expect(page.getByText("Second Example Note")).toBeVisible();
        await expect(page.getByText("Content of the second note.")).toBeVisible();
        await expect(page.locator("span", { hasText: "Work" })).toBeVisible();
        await expect(page.locator(".note-card span", { hasText: "react" })).toBeVisible();
        await expect(page.getByText("Manual entry")).toBeVisible();
    });
});

test.describe("NoteCard component with non-existing notes", () => {
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

    test("should display a message when no notes are found", async ({ page }) => {
        await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
        await expect(page.getByText("There are no notes here yet")).toBeVisible();
        await expect(page.getByText("Select text anywhere on the web or create a note manually to get started")).toBeVisible();
        await expect(page.getByRole("button", { name: "+ New Manual Note" })).toBeVisible();
    });
});
