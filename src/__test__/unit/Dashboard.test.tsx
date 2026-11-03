import { describe, expect, test, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Dashboard from "../../pages/Dashboard.tsx";
import { AllTheProviders } from "./Providers.tsx";

let mockUser: { id: string; email: string } | null = null;

const writeTextMock = vi.fn();

Object.assign(navigator, {
    clipboard: {
        writeText: writeTextMock,
    }
})

const mockShowNotification = vi.fn();

vi.mock("../../hooks/useNotification.tsx", () => ({
    default: () => ({
        showNotification: mockShowNotification,
    })
}));

const mockSignOut = vi.fn().mockResolvedValue({ error: null });

vi.mock("../../hooks/useUserToken.ts", () => ({
    useUserToken: () => ({
        user: mockUser,
        session: mockUser ? { access_token: "mock-token" } : null,
        token: mockUser ? "test-user-id" : null,
        loading: false,
        signOut: mockSignOut,
    })
}));

vi.mock("../../hooks/useNotes.tsx", () => ({
    default: () => ({
        notes: [],
        loading: false,
        updateTitle: vi.fn(),
        updateTags: vi.fn(),
        toggleFavorite: vi.fn(),
        deleteNote: vi.fn(),
        updateCat: vi.fn(),
        updateNote: vi.fn(),
        cat: ["All"],
    })
}));


describe("Dashboard Unit Tests", () => {
    beforeEach(() => {
        mockUser = { id: "test-user-id", email: "test@example.com" };
        localStorage.clear();
    });

    test("Elements that dashboard should contain even when there are no notes yet", async () => {
        render(<Dashboard />, { wrapper: AllTheProviders });

        expect(screen.getByText(/All Notes/i)).toBeInTheDocument();
        expect(screen.getByText(/Favorites/i)).toBeInTheDocument();
        expect(screen.getByText(/ClipSync/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Search notes, tags.../i)).toBeInTheDocument();
        expect(screen.getByText(/Auto-save/i)).toBeInTheDocument();
        expect(screen.getByText(/Authenticated User/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
        expect(screen.getByText(/There are no notes here yet/i)).toBeInTheDocument();
        expect(screen.getByText("All")).toBeInTheDocument();
        expect(screen.queryByText("Test")).not.toBeInTheDocument();
    });

    test("should call signOut when the logout button is clicked", () => {
        render(<Dashboard />, { wrapper: AllTheProviders });
        const logoutBtn = screen.getByRole("button", { name: "Logout" });
        fireEvent.click(logoutBtn);
        expect(mockSignOut).toHaveBeenCalled();
    });

    test("Opening modal for adding a new note", () => {
        render(<Dashboard />, { wrapper: AllTheProviders });
        expect(screen.queryByText("Add new note")).not.toBeInTheDocument();

        const newNoteBtn = screen.getByRole("button", {
            name: "New Note"
        });
        fireEvent.click(newNoteBtn);
        expect(screen.getByText("Add new note")).toBeInTheDocument();
    });

    test("should allow collapsing and expanding sidebar and persist state in localStorage", () => {
        render(<Dashboard />, { wrapper: AllTheProviders });

        // Sidebar should initially be open
        const collapseBtn = screen.getByRole("button", { name: "Collapse sidebar" });
        expect(collapseBtn).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Expand sidebar" })).not.toBeInTheDocument();

        // Click collapse button
        fireEvent.click(collapseBtn);
        expect(localStorage.getItem("clipsync_sidebar_open")).toBe("false");

        // Expand button should now be visible in the header
        const expandBtn = screen.getByRole("button", { name: "Expand sidebar" });
        expect(expandBtn).toBeInTheDocument();

        // Click expand button to restore
        fireEvent.click(expandBtn);
        expect(localStorage.getItem("clipsync_sidebar_open")).toBe("true");
        expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    });
});
