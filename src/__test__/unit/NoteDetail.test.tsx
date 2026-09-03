import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, test, describe, expect, vi } from "vitest";
import NoteDetail from "../../pages/NoteDetail.tsx";
import { fireEvent, render, screen } from "@testing-library/react";
import useNotes from "../../hooks/useNotes.tsx";
import type { Note } from "../../types/note.ts";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
    const actual = await vi.importActual<typeof import("react-router")>("react-router");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const writeTextMock = vi.fn();

Object.assign(navigator, {
    clipboard: {
        writeText: writeTextMock,
    },
});

const mockShowNotification = vi.fn();

vi.mock("../../hooks/useNotification.tsx", () => ({
    default: () => ({
        showNotification: mockShowNotification,
    }),
}));

vi.mock("../../hooks/useNotes.tsx", () => ({
    default: vi.fn(),
}));

describe("Note Details test elements", () => {
    const sampleNote: Note = {
        id: "21",
        text: "Test Note Content",
        source: "http://test.com",
        favorite: false,
        category: "test",
        title: "Test Note Title",
        tags: ["test"],
        created_at: new Date().toISOString(),
        user_id: "mock-user-id",
    };

    const mockToggleFavorite = vi.fn().mockResolvedValue(undefined);
    const mockDeleteNote = vi.fn().mockResolvedValue(true);
    const mockUpdateTitle = vi.fn().mockResolvedValue(undefined);
    const mockUpdateTags = vi.fn().mockResolvedValue(undefined);
    const mockUpdateCat = vi.fn().mockResolvedValue(undefined);
    const mockUpdateNote = vi.fn().mockResolvedValue({ success: true, error: null, data: null });
    const mockAddNote = vi.fn();

    const defaultNotesMock = {
        notes: [sampleNote],
        loading: false,
        updateTitle: mockUpdateTitle,
        updateTags: mockUpdateTags,
        toggleFavorite: mockToggleFavorite,
        deleteNote: mockDeleteNote,
        updateCat: mockUpdateCat,
        updateNote: mockUpdateNote,
        addNote: mockAddNote,
        cat: ["test", "All"],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNotes).mockReturnValue(defaultNotesMock);
    });

    test("The basic elements of the NoteDetail page should appear correctly.", async () => {
        render(
            <MemoryRouter initialEntries={["/note/21"]}>
                <Routes>
                    <Route
                        path="/note/:id"
                        element={<NoteDetail />}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Return")).toBeInTheDocument();
        expect(screen.getByText("ClipSync")).toBeInTheDocument();

        // Copy function
        const copyBtn = screen.getByTitle("Copy text");
        expect(copyBtn).toBeInTheDocument();
        await fireEvent.click(copyBtn);
        expect(mockShowNotification).toHaveBeenCalledWith("Copy to clipboard", false);

        // Edit function
        const editBtn = screen.getByTitle("Edit note");
        expect(editBtn).toBeInTheDocument();
        await fireEvent.click(editBtn);
        expect(screen.getByText("Cancel")).toBeInTheDocument();
        expect(screen.getByText("Save changes")).toBeInTheDocument();
    });

    test("The page should render successfully if the note exists", async () => {
        render(
            <MemoryRouter initialEntries={["/note/21"]}>
                <Routes>
                    <Route
                        path="/note/:id"
                        element={<NoteDetail />}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("#test")).toBeInTheDocument();
        expect(screen.getByText("test.com")).toBeInTheDocument();
        expect(screen.getByText(/min read/i)).toBeInTheDocument();
        expect(screen.getByText("Test Note Title")).toBeInTheDocument();
        expect(screen.getByText(/Test Note Content/i)).toBeInTheDocument();
        expect(screen.getByText("test")).toBeInTheDocument();
        expect(screen.getByText(/words/i)).toBeInTheDocument();
        expect(screen.getByText(/characters/i)).toBeInTheDocument();

        // delete function
        const deleteBtn = screen.getByTitle("Delete note");
        expect(deleteBtn).toBeInTheDocument();
        await fireEvent.click(deleteBtn);
        expect(mockDeleteNote).toHaveBeenCalledWith("21");
        expect(mockNavigate).toHaveBeenCalledWith("/");

        // toggle favorite (favorite is false => title is "Mark as favorite")
        const favoriteBtn = screen.getByTitle("Mark as favorite");
        expect(favoriteBtn).toBeInTheDocument();
        await fireEvent.click(favoriteBtn);
        expect(mockToggleFavorite).toHaveBeenCalledWith("21");
    });

    test("Should render 'Remove from favorites' when note is favorited and toggle favorite on click", async () => {
        vi.mocked(useNotes).mockReturnValue({
            ...defaultNotesMock,
            notes: [{ ...sampleNote, favorite: true }],
        });

        render(
            <MemoryRouter initialEntries={["/note/21"]}>
                <Routes>
                    <Route
                        path="/note/:id"
                        element={<NoteDetail />}
                    />
                </Routes>
            </MemoryRouter>
        );

        const favoriteBtn = screen.getByTitle("Remove from favorites");
        expect(favoriteBtn).toBeInTheDocument();
        await fireEvent.click(favoriteBtn);
        expect(mockToggleFavorite).toHaveBeenCalledWith("21");
    });

    test("If the note does NOT exist, the corresponding error message elements should be displayed.", () => {
        vi.mocked(useNotes).mockReturnValue({
            ...defaultNotesMock,
            notes: [],
        });

        render(
            <MemoryRouter initialEntries={["/note/9999"]}>
                <Routes>
                    <Route
                        path="/note/:id"
                        element={<NoteDetail />}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("The note you are trying to view does not exist or has been deleted.")).toBeInTheDocument();
        expect(screen.getByText("Note not found")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Return to Home" })).toBeInTheDocument();
    });

    test("If the note exists but does not contain a title or tags", async () => {
        vi.mocked(useNotes).mockReturnValue({
            ...defaultNotesMock,
            notes: [
                {
                    ...sampleNote,
                    title: "",
                    tags: [],
                    category: "article",
                },
            ],
        });

        render(
            <MemoryRouter initialEntries={["/note/21"]}>
                <Routes>
                    <Route
                        path="/note/:id"
                        element={<NoteDetail />}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("+ Add title")).toBeInTheDocument();
        expect(screen.getByText("+ Add tags")).toBeInTheDocument();
        expect(screen.getByText("article")).toBeInTheDocument();
    });
});