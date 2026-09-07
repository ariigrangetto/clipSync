import { describe, expect, test, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ExtensionPopup from "../../pages/ExtensionPopup.tsx";
import { AllTheProviders } from "./Providers.tsx";
import type { Note } from "../../types/note.ts";

let mockUser: { id: string; email: string } | null = { id: "user-1", email: "user@example.com" };
let mockNotes: Note[] = [];

const mockShowNotification = vi.fn();
vi.mock("../../hooks/useNotification.tsx", () => ({
    default: () => ({
        showNotification: mockShowNotification,
    }),
}));

const mockSignOut = vi.fn().mockResolvedValue({ error: null });
const mockAddNote = vi.fn().mockResolvedValue({ success: true, data: { id: "new-note" } });

vi.mock("../../hooks/useUserToken.ts", () => ({
    useUserToken: () => ({
        user: mockUser,
        session: mockUser ? { access_token: "mock-token" } : null,
        token: mockUser ? mockUser.id : null,
        loading: false,
        signOut: mockSignOut,
    }),
}));

vi.mock("../../hooks/useNotes.tsx", () => ({
    default: () => ({
        notes: mockNotes,
        loading: false,
        addNote: mockAddNote,
        deleteNote: vi.fn(),
        toggleFavorite: vi.fn(),
        updateTags: vi.fn(),
        updateTitle: vi.fn(),
        updateNote: vi.fn(),
        updateCat: vi.fn(),
        cat: ["All"],
    }),
}));

describe("ExtensionPopup Component Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockUser = { id: "user-1", email: "user@example.com" };
        mockNotes = [
            {
                id: "note-1",
                text: "First clipped note content",
                title: "Research Idea",
                category: "article",
                tags: ["web"],
                source: "https://example.com/article",
                created_at: new Date().toISOString(),
                favorite: false,
                user_id: "user-1",
            },
            {
                id: "note-2",
                text: "Second clipped snippet",
                title: "",
                category: "code",
                tags: ["js"],
                source: "Manual entry",
                created_at: new Date().toISOString(),
                favorite: true,
                user_id: "user-1",
            },
        ];
    });

    test("renders header, app introduction, and auto-save toggle", () => {
        render(<ExtensionPopup />, { wrapper: AllTheProviders });

        // Header & brand
        expect(screen.getByText("ClipSync")).toBeInTheDocument();
        expect(screen.getByText("Web Clipper Extension")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Open App/i })).toBeInTheDocument();

        // 1. Brief App Introduction
        expect(screen.getByText("Instant Note Syncing")).toBeInTheDocument();
        expect(
            screen.getByText(/Highlight any text on any webpage to save and sync it automatically/i)
        ).toBeInTheDocument();

        // 2. Auto-save toggle
        expect(screen.getByText("Auto-Save Selection")).toBeInTheDocument();
        expect(screen.getByTitle(/Disable Auto-Save/i)).toBeInTheDocument();
    });

    test("toggles auto-save state when switch is clicked", () => {
        render(<ExtensionPopup />, { wrapper: AllTheProviders });

        const toggleBtn = screen.getByTitle("Disable Auto-Save");
        expect(screen.getByText(/Active: Selected text on any web page will be saved/i)).toBeInTheDocument();

        fireEvent.click(toggleBtn);

        expect(mockShowNotification).toHaveBeenCalledWith("Auto-Save is disabled", false);
        expect(screen.getByText(/Paused: Free selection without automatic saving/i)).toBeInTheDocument();

        fireEvent.click(toggleBtn);
        expect(mockShowNotification).toHaveBeenCalledWith("Auto-Save is enabled", false);
    });

    test("renders user's latest notes list correctly", () => {
        render(<ExtensionPopup />, { wrapper: AllTheProviders });

        expect(screen.getByText("Latest Notes")).toBeInTheDocument();
        expect(screen.getByText("Research Idea")).toBeInTheDocument();
        expect(screen.getByText("First clipped note content")).toBeInTheDocument();
        expect(screen.getByText("Second clipped snippet")).toBeInTheDocument();
    });

    test("renders empty state when user has no notes", () => {
        mockNotes = [];
        render(<ExtensionPopup />, { wrapper: AllTheProviders });

        expect(screen.getByText("No notes yet")).toBeInTheDocument();
        expect(
            screen.getByText(/Highlight any text on a webpage or click "\+ Add Note" above/i)
        ).toBeInTheDocument();
    });

    test("renders sign in prompt when user is not authenticated", () => {
        mockUser = null;
        render(<ExtensionPopup />, { wrapper: AllTheProviders });

        expect(screen.getByText("Sign in to access your notebook")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Sign In \/ Create Account/i })).toBeInTheDocument();
    });
});
