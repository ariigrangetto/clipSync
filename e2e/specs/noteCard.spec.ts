import { test, expect } from "@playwright/test";

test.describe("NoteCard Component with existing notes", () => {
    test.beforeEach(async ({ page }) => {

        // 1. Inyectar el token en localStorage antes de cargar la página
        await page.addInitScript(() => {
            window.localStorage.setItem("clipsync_user_token", "clip_879a0f6f");
        });

        // 2. Interceptar las peticiones a la API de Supabase (Tabla "Notes")
        ///rest/v1 es la ruta estandar de la API REST que genera Supabase
        await page.route(/\/rest\/v1\/Notes/i, async (route) => {
            const mockNotes = [
                {
                    id: "note-1",
                    title: "Important Note",
                    text: "This is the complete content of the note for the detail view.",
                    category: "article",
                    tags: ["e2e", "playwright"],
                    source: "https://example.com",
                    user_token: "clip_879a0f6f",
                    created_at: new Date().toISOString(),
                    is_favorite: false
                },
                {
                    id: "note-2",
                    title: "Second Example Note",
                    text: "Content of the second note.",
                    category: "work",
                    tags: ["react"],
                    source: "Manual entry",
                    user_token: "clip_879a0f6f",
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
    });


    test("should display note details correctly when note exists", async ({ page }) => {
        await page.goto("http://localhost:5173");
        await expect(page.getByText("Important Note")).toBeVisible();
        await expect(page.getByText("Second Example Note")).toBeVisible();
    });

});


test.describe("NoteCard component with non-existing notes", () => {
    test.beforeEach(async ({ page }) => {

        //1. Inyecta el token de usuario en localStorage
        await page.addInitScript(() => {
            window.localStorage.setItem("clipsync_user_token", "clip_879a0f6f");
        });

        await page.route(/\/rest\/v1\/Notes/i, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([])
            })
        })
    });

    test("should display a message when no notes are found", async ({ page }) => {
        await page.goto("http://localhost:5173");
        await expect(page.getByText("There are no notes here yet.")).toBeVisible();
        await expect(page.getByText("Select text anywhere on the web or create a note manually to get started.")).toBeVisible();
        await expect(page.getByRole("button", { name: "+ New Manual Note" })).toBeVisible();
    });
})
