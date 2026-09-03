import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import NoteCard from "../../components/NoteCard.tsx";
import type { Note } from "../../types/note.ts";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
    const actual = await vi.importActual<typeof import("react-router")>("react-router");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("NoteCard Component Unit Tests", () => {
    const mockOnToggleFavorite = vi.fn();
    const mockOnDeleteNote = vi.fn();

    const sampleNote: Note = {
        id: "note-123",
        title: "Test Note Title",
        text: "This is sample note content for testing.",
        source: "https://example.com/article",
        user_id: "user-1",
        created_at: new Date().toISOString(),
        tags: ["react", "testing"],
        favorite: false,
        category: "article",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Rendering with data (Success state)", () => {
        test("should render title, content, source, category, tags, and relative date", () => {
            render(
                <MemoryRouter>
                    <NoteCard
                        note={sampleNote}
                        onToggleFavorite={mockOnToggleFavorite}
                        onDeleteNote={mockOnDeleteNote}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText("Test Note Title")).toBeInTheDocument();
            expect(screen.getByText("This is sample note content for testing.")).toBeInTheDocument();
            expect(screen.getByText("https://example.com/article")).toBeInTheDocument();
            expect(screen.getByText("article")).toBeInTheDocument();
            expect(screen.getByText("react")).toBeInTheDocument();
            expect(screen.getByText("testing")).toBeInTheDocument();
            expect(screen.getByText(/Just now/i)).toBeInTheDocument();
            expect(screen.getByTitle("Add to favorites")).toBeInTheDocument();
            expect(screen.getByTitle("Delete note")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /Open/i })).toBeInTheDocument();
        });

        test("should render favorite state correctly when favorite is true", () => {
            const favoriteNote: Note = {
                ...sampleNote,
                favorite: true,
            };

            render(
                <MemoryRouter>
                    <NoteCard
                        note={favoriteNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            expect(screen.getByTitle("Remove from favorites")).toBeInTheDocument();
        });
    });

    describe("Category specific rendering", () => {
        test("should render quote category with quotation marks and italic styling", () => {
            const quoteNote: Note = {
                ...sampleNote,
                category: "quote",
                text: "The only limit to our realization of tomorrow is our doubts of today.",
            };

            render(
                <MemoryRouter>
                    <NoteCard
                        note={quoteNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText('"The only limit to our realization of tomorrow is our doubts of today."')).toBeInTheDocument();
            expect(screen.getByText("quote")).toBeInTheDocument();
        });

        test("should render code category with monospace styling and content", () => {
            const codeNote: Note = {
                ...sampleNote,
                category: "code",
                text: "const greet = () => console.log('hello');",
            };

            render(
                <MemoryRouter>
                    <NoteCard
                        note={codeNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText("const greet = () => console.log('hello');")).toBeInTheDocument();
            expect(screen.getByText("code")).toBeInTheDocument();
        });

        test("should not render category badge if category is empty or undefined", () => {
            const noCatNote: Note = {
                ...sampleNote,
                category: "",
            };

            render(
                <MemoryRouter>
                    <NoteCard
                        note={noCatNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            expect(screen.queryByText("article")).not.toBeInTheDocument();
        });
    });

    describe("Empty states, Fallbacks and Edge Cases", () => {
        test("should render '+ Add title' when note has no title", () => {
            const noTitleNote: Note = {
                ...sampleNote,
                title: "",
            };

            render(
                <MemoryRouter>
                    <NoteCard
                        note={noTitleNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText("+ Add title")).toBeInTheDocument();
        });

        test("should render '+ Add tags' when note tags array is empty", () => {
            const noTagsNote: Note = {
                ...sampleNote,
                tags: [],
            };

            render(
                <MemoryRouter>
                    <NoteCard
                        note={noTagsNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText("+ Add tags")).toBeInTheDocument();
        });

        test("should render '+ Add tags' when tags prop is not an array", () => {
            const invalidTagsNote = {
                ...sampleNote,
                tags: null as unknown as string[],
            };

            render(
                <MemoryRouter>
                    <NoteCard
                        note={invalidTagsNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText("+ Add tags")).toBeInTheDocument();
        });

        test("should render 'Manual Entry' when source is empty", () => {
            const noSourceNote: Note = {
                ...sampleNote,
                source: "",
            };

            render(
                <MemoryRouter>
                    <NoteCard
                        note={noSourceNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText("Manual Entry")).toBeInTheDocument();
        });

        test("should handle missing or invalid created_at date gracefully", () => {
            const invalidDateNote: Note = {
                ...sampleNote,
                created_at: "invalid-date-string",
            };

            render(
                <MemoryRouter>
                    <NoteCard
                        note={invalidDateNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText("Not date")).toBeInTheDocument();
        });

        test("should format relative dates correctly for different time ranges", () => {
            const now = Date.now();
            const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
            const oneMinuteAgo = new Date(now - 1 * 60 * 1000).toISOString();
            const threeHoursAgo = new Date(now - 3 * 3600 * 1000).toISOString();
            const oneHourAgo = new Date(now - 1 * 3600 * 1000).toISOString();
            const twoDaysAgo = new Date(now - 2 * 24 * 3600 * 1000).toISOString();
            const oneDayAgo = new Date(now - 1 * 24 * 3600 * 1000).toISOString();

            const { rerender } = render(
                <MemoryRouter>
                    <NoteCard note={{ ...sampleNote, created_at: fiveMinutesAgo }} onToggleFavorite={mockOnToggleFavorite} />
                </MemoryRouter>
            );
            expect(screen.getByText("5 mins ago")).toBeInTheDocument();

            rerender(
                <MemoryRouter>
                    <NoteCard note={{ ...sampleNote, created_at: oneMinuteAgo }} onToggleFavorite={mockOnToggleFavorite} />
                </MemoryRouter>
            );
            expect(screen.getByText("1 min ago")).toBeInTheDocument();

            rerender(
                <MemoryRouter>
                    <NoteCard note={{ ...sampleNote, created_at: oneHourAgo }} onToggleFavorite={mockOnToggleFavorite} />
                </MemoryRouter>
            );
            expect(screen.getByText("1 hour ago")).toBeInTheDocument();

            rerender(
                <MemoryRouter>
                    <NoteCard note={{ ...sampleNote, created_at: threeHoursAgo }} onToggleFavorite={mockOnToggleFavorite} />
                </MemoryRouter>
            );
            expect(screen.getByText("3 hours ago")).toBeInTheDocument();

            rerender(
                <MemoryRouter>
                    <NoteCard note={{ ...sampleNote, created_at: oneDayAgo }} onToggleFavorite={mockOnToggleFavorite} />
                </MemoryRouter>
            );
            expect(screen.getByText("1 day ago")).toBeInTheDocument();

            rerender(
                <MemoryRouter>
                    <NoteCard note={{ ...sampleNote, created_at: twoDaysAgo }} onToggleFavorite={mockOnToggleFavorite} />
                </MemoryRouter>
            );
            expect(screen.getByText("2 days ago")).toBeInTheDocument();
        });
    });

    describe("User Interactions and Events", () => {
        test("should navigate to note detail when the card is clicked", () => {
            render(
                <MemoryRouter>
                    <NoteCard
                        note={sampleNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            const title = screen.getByText("Test Note Title");
            fireEvent.click(title);

            expect(mockNavigate).toHaveBeenCalledWith("/note/note-123");
        });

        test("should navigate to note detail when Open button is clicked", () => {
            render(
                <MemoryRouter>
                    <NoteCard
                        note={sampleNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            const openBtn = screen.getByRole("button", { name: /Open/i });
            fireEvent.click(openBtn);

            expect(mockNavigate).toHaveBeenCalledWith("/note/note-123");
        });

        test("should call onToggleFavorite and prevent card navigation when favorite button is clicked", () => {
            render(
                <MemoryRouter>
                    <NoteCard
                        note={sampleNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            const favoriteBtn = screen.getByTitle("Add to favorites");
            fireEvent.click(favoriteBtn);

            expect(mockOnToggleFavorite).toHaveBeenCalledWith("note-123");
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        test("should handle mouse enter and leave on unfavorited heart button", () => {
            render(
                <MemoryRouter>
                    <NoteCard
                        note={sampleNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            const favoriteBtn = screen.getByTitle("Add to favorites");
            fireEvent.mouseEnter(favoriteBtn);
            expect(favoriteBtn.style.color).toBe("rgb(94, 158, 110)");

            fireEvent.mouseLeave(favoriteBtn);
            expect(favoriteBtn.style.color).toBe("rgb(110, 107, 101)");
        });

        test("should call onDeleteNote and prevent card navigation when delete button is clicked", () => {
            render(
                <MemoryRouter>
                    <NoteCard
                        note={sampleNote}
                        onToggleFavorite={mockOnToggleFavorite}
                        onDeleteNote={mockOnDeleteNote}
                    />
                </MemoryRouter>
            );

            const deleteBtn = screen.getByTitle("Delete note");
            fireEvent.click(deleteBtn);

            expect(mockOnDeleteNote).toHaveBeenCalledWith("note-123");
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        test("should not render delete button when onDeleteNote prop is not provided", () => {
            render(
                <MemoryRouter>
                    <NoteCard
                        note={sampleNote}
                        onToggleFavorite={mockOnToggleFavorite}
                    />
                </MemoryRouter>
            );

            expect(screen.queryByTitle("Delete note")).not.toBeInTheDocument();
        });
    });
});