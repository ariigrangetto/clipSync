import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import AddNoteModal from "../../components/AddNoteModal.tsx";

describe("AddNoteModal Component Unit Tests", () => {
  const mockOnClose = vi.fn();
  const mockOnAddNote = vi.fn();
  const mockShowNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Conditional rendering & Initial UI", () => {
    test("should not render modal when isOpen is false", () => {
      render(
        <AddNoteModal
          isOpen={false}
          onClose={mockOnClose}
          onAddNote={mockOnAddNote}
          showNotification={mockShowNotification}
        />
      );

      expect(screen.queryByTestId("add-note-modal")).not.toBeInTheDocument();
      expect(screen.queryByText("Add new note")).not.toBeInTheDocument();
    });

    test("should render modal with all fields and buttons when isOpen is true", () => {
      render(
        <AddNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onAddNote={mockOnAddNote}
          showNotification={mockShowNotification}
        />
      );

      expect(screen.getByTestId("add-note-modal")).toBeInTheDocument();
      expect(screen.getByText("Add new note")).toBeInTheDocument();
      expect(
        screen.getByText("Create a manual note associated with your ClipSync account")
      ).toBeInTheDocument();

      // Inputs
      expect(
        screen.getByPlaceholderText("Eg. Project meeting notes, book title...")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Write the content or text snippet here...")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Eg. react, startups, figma")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Eg. https://miweb.com or Manual entry")
      ).toBeInTheDocument();

      // Categories
      expect(screen.getByRole("button", { name: /^article$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^research$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^code$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^quote$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^design$/i })).toBeInTheDocument();

      // Actions
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Save Note Button" })
      ).toBeInTheDocument();
    });
  });

  describe("Category selection", () => {
    test("should update selected category when clicking on category options", () => {
      render(
        <AddNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onAddNote={mockOnAddNote}
          showNotification={mockShowNotification}
        />
      );

      const codeCategoryBtn = screen.getByRole("button", { name: /^code$/i });
      fireEvent.click(codeCategoryBtn);

      // Verify active styling on selected category
      expect(codeCategoryBtn.style.background).toBe("rgb(94, 158, 110)");
    });
  });

  describe("Validation & Error handling", () => {
    test("should show notification and not submit when note content is empty or whitespace", async () => {
      render(
        <AddNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onAddNote={mockOnAddNote}
          showNotification={mockShowNotification}
        />
      );

      const titleInput = screen.getByPlaceholderText(
        "Eg. Project meeting notes, book title..."
      );
      fireEvent.change(titleInput, { target: { value: "My Title" } });

      const form = screen.getByRole("button", { name: "Save Note Button" }).closest("form");
      expect(form).not.toBeNull();
      fireEvent.submit(form!);

      expect(mockShowNotification).toHaveBeenCalledWith(
        "Note content cannot be empty",
        true
      );
      expect(mockOnAddNote).not.toHaveBeenCalled();
    });
  });

  describe("Successful form submission", () => {
    test("should submit note with formatted data, default source, reset fields and close modal", async () => {
      mockOnAddNote.mockResolvedValue({
        success: true,
        data: {
          id: "101",
          title: "Architecture notes",
          text: "Design patterns in React",
          category: "code",
          tags: ["react", "frontend"],
          source: "Manual entry",
          favorite: false,
          user_id: "user-1",
          created_at: new Date().toISOString(),
        },
      });

      render(
        <AddNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onAddNote={mockOnAddNote}
          showNotification={mockShowNotification}
        />
      );

      const titleInput = screen.getByPlaceholderText(
        "Eg. Project meeting notes, book title..."
      );
      const textInput = screen.getByPlaceholderText(
        "Write the content or text snippet here..."
      );
      const tagsInput = screen.getByPlaceholderText("Eg. react, startups, figma");
      const codeCategoryBtn = screen.getByRole("button", { name: /^code$/i });

      fireEvent.change(titleInput, { target: { value: "Architecture notes" } });
      fireEvent.change(textInput, { target: { value: "Design patterns in React" } });
      fireEvent.change(tagsInput, { target: { value: " react, frontend , " } });
      fireEvent.click(codeCategoryBtn);

      const submitBtn = screen.getByRole("button", { name: "Save Note Button" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnAddNote).toHaveBeenCalledWith({
          text: "Design patterns in React",
          title: "Architecture notes",
          category: "code",
          tags: ["react", "frontend"],
          source: "Manual entry",
        });
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    test("should pass custom source and handle undefined title when title is empty", async () => {
      mockOnAddNote.mockResolvedValue({
        success: true,
        data: null,
      });

      render(
        <AddNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onAddNote={mockOnAddNote}
          showNotification={mockShowNotification}
        />
      );

      const textInput = screen.getByPlaceholderText(
        "Write the content or text snippet here..."
      );
      const sourceInput = screen.getByPlaceholderText(
        "Eg. https://miweb.com or Manual entry"
      );

      fireEvent.change(textInput, { target: { value: "Only text note" } });
      fireEvent.change(sourceInput, { target: { value: "https://example.com" } });

      const submitBtn = screen.getByRole("button", { name: "Save Note Button" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnAddNote).toHaveBeenCalledWith({
          text: "Only text note",
          title: undefined,
          category: "article",
          tags: [],
          source: "https://example.com",
        });
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Failed submission & Submitting state", () => {
    test("should not close or reset modal when onAddNote returns success false", async () => {
      mockOnAddNote.mockResolvedValue({
        success: false,
        error: "Network error",
      });

      render(
        <AddNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onAddNote={mockOnAddNote}
          showNotification={mockShowNotification}
        />
      );

      const textInput = screen.getByPlaceholderText(
        "Write the content or text snippet here..."
      );
      fireEvent.change(textInput, { target: { value: "Unsaved note content" } });

      const submitBtn = screen.getByRole("button", { name: "Save Note Button" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnAddNote).toHaveBeenCalledTimes(1);
      });

      expect(mockOnClose).not.toHaveBeenCalled();
      expect(
        (screen.getByPlaceholderText(
          "Write the content or text snippet here..."
        ) as HTMLTextAreaElement).value
      ).toBe("Unsaved note content");
    });
  });

  describe("Modal closing interactions", () => {
    test("should call onClose when clicking backdrop overlay", () => {
      const { container } = render(
        <AddNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onAddNote={mockOnAddNote}
          showNotification={mockShowNotification}
        />
      );

      const backdrop = container.querySelector(".fixed.inset-0.bg-black\\/70");
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test("should call onClose when clicking top-right Close icon button", () => {
      render(
        <AddNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onAddNote={mockOnAddNote}
          showNotification={mockShowNotification}
        />
      );

      const closeBtn = screen.getByRole("button", { name: "Close" });
      fireEvent.click(closeBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test("should call onClose when clicking Cancel button", () => {
      render(
        <AddNoteModal
          isOpen={true}
          onClose={mockOnClose}
          onAddNote={mockOnAddNote}
          showNotification={mockShowNotification}
        />
      );

      const cancelBtn = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
