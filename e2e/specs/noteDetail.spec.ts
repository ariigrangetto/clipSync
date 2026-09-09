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

test.describe("NoteDetail Page", () => {
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
            const method = route.request().method();

            if (method === "GET") {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify([
                        {
                            id: "note-1",
                            title: "Important Note",
                            text: "This is the complete content of the note for the detail view.",
                            category: "article",
                            tags: ["e2e", "detail"],
                            source: "https://example.com/article",
                            user_token: "e2e-user-id",
                            created_at: new Date().toISOString(),
                            favorite: false
                        }
                    ])
                });
            } else if (method === "PATCH") {
                let postData: { title?: string; text?: string; category?: string; tags?: string[]; source?: string } = {};
                try {
                    postData = route.request().postDataJSON() || {};
                } catch {
                    postData = {};
                }

                const createdNote = {
                    id: "note-1",
                    title: postData.title || "Important Note",
                    text: postData.text || "This is the complete content of the note for the detail view.",
                    category: postData.category || "article",
                    tags: postData.tags || ["e2e", "detail"],
                    source: postData.source || "https://example.com/article",
                    user_token: "e2e-user-id",
                    created_at: new Date().toISOString(),
                    favorite: false
                };

                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    headers: {
                        "content-type": "application/json",
                        "access-control-allow-origin": "*",
                        "access-control-allow-headers": "*",
                        "preference-applied": "return=representation"
                    },
                    body: JSON.stringify([createdNote])
                });
            } else if (method === "DELETE") {
                await route.fulfill({
                    status: 204,
                    contentType: "application/json",
                });
                return;
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
    });

    test("should display note details correctly when note exists", async ({ page }) => {
        await page.goto("http://localhost:5173/note/note-1", { waitUntil: "domcontentloaded" });
        await expect(page.getByText("Important Note")).toBeVisible();
        await expect(page.getByText("This is the complete content of the note for the detail view.")).toBeVisible();
        await expect(page.getByText("ARTICLE")).toBeVisible();
        await expect(page.getByText("#e2e")).toBeVisible();
        await expect(page.getByText("#detail")).toBeVisible();
        await expect(page.getByText("example.com")).toBeVisible();

        const toggleFavorite = page.getByTitle("Mark as favorite");
        await expect(toggleFavorite).toBeVisible();
        await toggleFavorite.click();
        await expect(page.getByTitle("Remove from favorites")).toBeVisible();

        await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Return" })).toBeVisible();
    });

    test("should be able to toggle favorite", async ({ page }) => {
        await page.goto("http://localhost:5173/note/note-1", { waitUntil: "domcontentloaded" });
        const toggleFavorite = page.getByTitle("Mark as favorite");
        await expect(toggleFavorite).toBeVisible();
        await toggleFavorite.click();
        await expect(page.getByTitle("Remove from favorites")).toBeVisible();
    });

    test("should be able to copy the note text", async ({ page }) => {

        await page.addInitScript(() => {
            Object.defineProperty(navigator, "clipboard", {
                value: {
                    writeText: () => Promise.resolve(),
                },
                configurable: true,
            });
        });

        await page.goto("http://localhost:5173/note/note-1", { waitUntil: "domcontentloaded" });
        const copyButton = page.getByRole("button", { name: "Copy" });
        await expect(copyButton).toBeVisible();
        await copyButton.click();
        await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    });


    test("note should be deleted when delete button is clicked", async ({ page }) => {
        await page.goto("http://localhost:5173/note/note-1", { waitUntil: "domcontentloaded" });
        const deleteButton = page.getByTitle("Delete");
        await expect(deleteButton).toBeVisible();
        await deleteButton.click();

        await expect(page).toHaveURL("http://localhost:5173");
    });


    test("should be able to edit the note successfully", async ({ page }) => {
        await page.goto("http://localhost:5173/note/note-1", { waitUntil: "domcontentloaded" });
        const editBtn = page.getByRole("button", { name: "Edit" });
        await expect(editBtn).toBeVisible();
        await editBtn.click();

        const textArea = page.getByRole("textbox");
        await expect(textArea).toBeVisible();
        const newText = "This is the UPDATED content of the note for the detail view.";
        await textArea.fill(newText);

        const saveBtn = page.getByRole("button", { name: "Save Changes" });
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        await expect(page.getByText(newText)).toBeVisible();
    });

    test("should display 'Note not found' when note ID does not exist", async ({ page }) => {
        await page.goto("http://localhost:5173/note/inexistente-999", { waitUntil: "domcontentloaded" });
        await expect(page.getByText("Note not found")).toBeVisible();
        await expect(page.getByText("The note you are trying to view does not exist or has been deleted.")).toBeVisible();
        await expect(page.getByRole("link", { name: "Return to Home" })).toBeVisible();
    });
});
