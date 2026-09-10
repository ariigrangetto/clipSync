/* eslint-disable no-useless-assignment */
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

test.describe("AddNoteModal Component", () => {
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

        //API de notas
        await page.route(/\/rest\/v1\/Notes/i, async (route) => {
            const method = route.request().method();

            if (method === "GET") {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify([])
                });
            } else if (method === "POST" || method === "OPTIONS") {
                let postData: { title?: string; text?: string; category?: string; tags?: string[]; source?: string } = {};
                try {

                    postData = route.request().postDataJSON() || {};
                } catch {
                    postData = {};
                }

                const createdNote = {
                    id: "note-new-1",
                    title: postData.title || "Untitled",
                    text: postData.text || "Sample content",
                    category: postData.category || "article",
                    tags: postData.tags || [],
                    source: postData.source || "Entrada manual",
                    user_token: "e2e-user-id",
                    created_at: new Date().toISOString(),
                    favorite: false
                };

                await route.fulfill({
                    status: 201,
                    contentType: "application/json",
                    headers: {
                        "content-type": "application/json",
                        "access-control-allow-origin": "*",
                        "access-control-allow-headers": "*",
                        "preference-applied": "return=representation"
                    },
                    body: JSON.stringify([createdNote])
                });
            } else {
                await route.continue();
            }
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
        await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("button", { name: "New Note" })).toBeVisible();
    });

    test("should open the AddNoteModal when clicking 'New Note' button", async ({ page }) => {
        await page.getByRole("button", { name: "New Note" }).click();

        const modal = page.getByTestId("add-note-modal");
        await expect(modal).toBeVisible();
        await expect(modal.getByRole("heading", { name: "Add new note" })).toBeVisible();
        await expect(modal.getByPlaceholder("Write the content or text snippet here...")).toBeVisible();
    });

    test("should close the modal when clicking 'Cancel' button", async ({ page }) => {
        await page.getByRole("button", { name: "New Note" }).click();

        const modal = page.getByTestId("add-note-modal");
        await expect(modal).toBeVisible();

        await modal.getByRole("button", { name: "Cancel" }).click();
        await expect(modal).not.toBeVisible();
    });

    test("should close the modal when clicking the close (X) button", async ({ page }) => {
        await page.getByRole("button", { name: "New Note" }).click();

        const modal = page.getByTestId("add-note-modal");
        await expect(modal).toBeVisible();

        await modal.getByRole("button", { name: "Close" }).click();
        await expect(modal).not.toBeVisible();
    });

    test("should fill and submit a new note form successfully", async ({ page }) => {
        await page.getByRole("button", { name: "New Note" }).click();

        const modal = page.getByTestId("add-note-modal");
        await expect(modal).toBeVisible();

        await modal.getByPlaceholder("Eg. Project meeting notes, book title...").fill("E2E Test Note Title");
        await modal.getByRole("button", { name: "research" }).click();
        await modal.getByPlaceholder("Write the content or text snippet here...").fill("This is the main content written during E2E test.");
        await modal.getByPlaceholder("Eg. react, startups, figma").fill("playwright, e2e, testing");
        await modal.getByPlaceholder("Eg. https://miweb.com or Manual entry").fill("https://playwright.dev");
        await modal.getByRole("button", { name: "Save Note Button" }).click();


        // Modal should close when note is saved
        await expect(modal).not.toBeVisible();
    });
});
