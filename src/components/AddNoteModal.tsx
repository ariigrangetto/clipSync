import { useState } from "react";
import type { Category, Note } from "../types/note";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNote: (params: {
    text: string;
    title?: string;
    category?: string;
    tags?: string[];
    source?: string;
  }) => Promise<{ success: boolean; data?: Note | null; error?: string | null }>;
  showNotification: (message: string, isError: boolean) => void;
}

const CATEGORIES: Category[] = ["article", "research", "code", "quote", "design"];

export default function AddNoteModal({
  isOpen,
  onClose,
  onAddNote,
  showNotification,
}: AddNoteModalProps) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("article");
  const [tagsInput, setTagsInput] = useState("");
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      showNotification("El contenido de la nota no puede estar vacío", true);
      return;
    }

    setSubmitting(true);
    const formattedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const response = await onAddNote({
      text: text.trim(),
      title: title.trim() || undefined,
      category: category === "All" ? "article" : category,
      tags: formattedTags,
      source: source.trim() || "Entrada manual",
    });

    if (response.success) {
      setSubmitting(false);
      setTitle("");
      setText("");
      setCategory("article");
      setTagsInput("");
      setSource("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        data-testid="add-note-modal"
        className="relative w-full max-w-lg rounded-2xl p-6 shadow-xl z-10 animate-in fade-in zoom-in duration-150"
        style={{
          background: "#1A1E1C",
          border: "1px solid #2C322E",
          color: "#EDEDEA",
          fontFamily: "var(--font-body)",
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-petal-border">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "#EDEDEA" }}
            >
              Add new note
            </h2>
            <p className="text-xs text-petal-muted">
              Create a manual note associated with your ClipSync account
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#232825] transition-colors text-[#9E9B93] cursor-pointer"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#9E9B93] mb-1">
              Title
            </label>
            <input
              type="text"
              placeholder="Eg. Project meeting notes, book title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-petal-border bg-[#141615] text-[#EDEDEA] placeholder-[#6E6B65] focus:bg-[#181C1A] focus:border-petal-green outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9E9B93] mb-1">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all capitalize cursor-pointer"
                    style={{
                      background: isActive ? "#5E9E6E" : "#232825",
                      color: isActive ? "#FFFFFF" : "#9E9B93",
                      border: isActive ? "1px solid #5E9E6E" : "1px solid #2C322E",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9E9B93] mb-1">
              Note content <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write the content or text snippet here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-petal-border bg-[#141615] text-[#EDEDEA] placeholder-[#6E6B65] focus:bg-[#181C1A] focus:border-petal-green outline-none transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9E9B93] mb-1">
              Tags (separated by comma)
            </label>
            <input
              type="text"
              placeholder="Eg. react, startups, figma"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-petal-border bg-[#141615] text-[#EDEDEA] placeholder-[#6E6B65] focus:bg-[#181C1A] focus:border-petal-green outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9E9B93] mb-1">
              Source / URL (Optional)
            </label>
            <input
              type="text"
              placeholder="Eg. https://miweb.com or Manual entry"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-petal-border bg-[#141615] text-[#EDEDEA] placeholder-[#6E6B65] focus:bg-[#181C1A] focus:border-petal-green outline-none transition-all"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-petal-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#9E9B93] hover:bg-[#232825] hover:text-[#EDEDEA] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              aria-label="Save Note Button"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              style={{ background: "#5E9E6E" }}
            >
              {submitting ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
