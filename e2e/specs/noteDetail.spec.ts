import { test, expect } from "@playwright/test";

test.describe("NoteDetail Page", () => {
    test.beforeEach(async ({ page }) => {
        // 1. Inyectar el token en localStorage antes de cada prueba
        await page.addInitScript(() => {
            window.localStorage.setItem("clipsync_user_token", "clip_879a0f6f");
        });

        // 2. Interceptar las peticiones a Supabase (Tabla "Notes")
        await page.route(/\/rest\/v1\/Notes/i, async (route) => {
            const mockNotes = [
                {
                    id: "note-1",
                    title: "Important Note",
                    text: "This is the complete content of the note for the detail view.",
                    category: "article",
                    tags: ["e2e", "detail"],
                    source: "https://example.com/article",
                    user_token: "clip_879a0f6f",
                    created_at: new Date().toISOString(),
                    is_favorite: false
                }
            ];

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(mockNotes)
            });
        });
    });

    test("should display note details correctly when note exists", async ({ page }) => {
        await page.goto("http://localhost:5173/note/note-1");
        await expect(page.getByText("Important Note")).toBeVisible();
        await expect(page.getByText("This is the complete content of the note for the detail view.")).toBeVisible();
        await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Return" })).toBeVisible();
    });

    test("should display 'Note not found' when note ID does not exist", async ({ page }) => {
        await page.goto("http://localhost:5173/note/inexistente-999");
        await expect(page.getByText("Note not found")).toBeVisible();
        await expect(page.getByText("The note you are trying to view does not exist or has been deleted.")).toBeVisible();
        await expect(page.getByRole("link", { name: "Return to Home" })).toBeVisible();
    });
});
