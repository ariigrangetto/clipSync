import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Login from "../pages/Login.tsx";
import ErrorPage from "../pages/ErrorPage.tsx";
import Dashboard from "../pages/Dashboard.tsx";
import NoteDetail from "../pages/NoteDetail.tsx";
import NotesProvider from "../context/notesContext.tsx";
import { describe, expect, test, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router";
import * as ReactRouter from "react-router";

vi.mock("../hooks/useNotes.tsx", () => ({
    default: () => ({
        notes: [
            {
                id: 21,
                text: "Test Note Content",
                source: "http://test.com",
                favorite: false,
                category: "test",
                title: "Test Note Title",
                tags: ["test"],
                created_at: new Date().toISOString(),
            }
        ],
        loading: false,
        updateTitle: vi.fn(),
        updateTags: vi.fn(),
        toggleFavorite: vi.fn(),
        deleteNote: vi.fn(),
        updateCat: vi.fn(),
        updateNote: vi.fn(),

        cat: ["test", "All"],
    })

}))



const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <MemoryRouter>
            <NotesProvider>
                {children}
            </NotesProvider>
        </MemoryRouter>
    )
};

describe("test to see if users can find the elements  in the pages Login, Dashboard, NoteDetail and ErrorPage", () => {
    test("login page should render", () => {
        render(<Login />, { wrapper: AllTheProviders });
        const h1Element = screen.getByRole("heading", { name: /ClipSync/i })
        const placeHolderElement = screen.getByPlaceholderText(/Ej: clip_a8f92b/i)
        const loginElement = screen.getByText(/Tu Espacio de Notas/i);
        const createBtnElement = screen.getByRole("button", { name: /Crear Nuevo Espacio Instantáneo/i });

        fireEvent.click(screen.getByText(/Acceder a mi espacio/i));

        expect(h1Element).toBeInTheDocument();
        expect(loginElement).toBeInTheDocument();
        expect(createBtnElement).toBeInTheDocument();
        expect(placeHolderElement).toBeInTheDocument();
    })

    test("dashboard page should render", () => {
        render(<Dashboard />, { wrapper: AllTheProviders });
        const allNotesBtn = screen.getByText(/All Notes/i);
        const allFavorites = screen.getByText(/Favorites/i);
        const clipSyncText = screen.getByText(/ClipSync/i);
        const createNewBtn = screen.getByRole("button", { name: /New Note/i });
        const searchPlaceholder = screen.getByPlaceholderText(/Search notes, tags.../i)
        const saveTextAuto = screen.getByText(/Auto-save/i);
        const token = screen.getByText(/Your User Token/i);
        const allText = screen.getByRole("button", { name: "All" });


        expect(allNotesBtn).toBeInTheDocument();
        expect(allFavorites).toBeInTheDocument();
        expect(createNewBtn).toBeInTheDocument();
        expect(searchPlaceholder).toBeInTheDocument();
        expect(clipSyncText).toBeInTheDocument();
        expect(saveTextAuto).toBeInTheDocument();
        expect(token).toBeInTheDocument();
        expect(allText).toBeInTheDocument();
    })

    test("note detail page should render", () => {
        render(
            <MemoryRouter initialEntries={["/note/21"]}>
                <Routes>
                    <Route path="/note/:id" element={<NoteDetail />} />
                </Routes>
            </MemoryRouter>
        );

        const noteTitle = screen.getByText("Test Note Title");
        const noteText = screen.getByText("Test Note Content");
        const clipSyncText = screen.getByText("ClipSync");
        const copyBtn = screen.getByRole("button", { name: "Copy" });
        const editBtn = screen.getByRole("button", { name: "Edit" });
        const minRead = screen.getByText(/min read/i);
        const words = screen.getByText(/words/i);
        const chars = screen.getByText(/characters/i);
        const tags = screen.getByText(/Tags/i);
        const noteCategory = screen.getByText("test");

        expect(noteTitle).toBeInTheDocument();
        expect(noteText).toBeInTheDocument();
        expect(copyBtn).toBeInTheDocument();
        expect(editBtn).toBeInTheDocument();
        expect(minRead).toBeInTheDocument();
        expect(words).toBeInTheDocument();
        expect(chars).toBeInTheDocument();
        expect(tags).toBeInTheDocument();
        expect(noteCategory).toBeInTheDocument();
        expect(clipSyncText).toBeInTheDocument();
    })

    test("error page should render stardard Error message", () => {
        vi.spyOn(ReactRouter, "useRouteError").mockReturnValue({
            status: 404,
            statusText: "Page not found",
            data: { message: "The page does not exists" }
        });

        vi.spyOn(ReactRouter, "isRouteErrorResponse").mockReturnValue(true);

        render(
            <MemoryRouter>
                <ErrorPage />
            </MemoryRouter >
        );

        const status = screen.getByText("404");
        const statusText = screen.getByText("Page not found");
        const statusMessage = screen.getByText("The page does not exists");
        const clipSyncText = screen.getByRole("link", { name: /ClipSync/i });
        const returnText = screen.getByRole("link", { name: "Return home" });
        const rightsText = screen.getByText(/All rights reserved\./i);


        expect(clipSyncText).toBeInTheDocument();
        expect(returnText).toBeInTheDocument();
        expect(rightsText).toBeInTheDocument();
        expect(status).toBeInTheDocument();
        expect(statusText).toBeInTheDocument();
        expect(statusMessage).toBeInTheDocument();
    })
})