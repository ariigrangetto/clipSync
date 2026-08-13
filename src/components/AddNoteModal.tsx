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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 shadow-xl z-10 animate-in fade-in zoom-in duration-150"
        style={{
          background: "#FAFAF7",
          border: "1px solid #E5DED0",
          color: "#1C1914",
          fontFamily: "var(--font-body)",
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-petal-border">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "#1C1914" }}
            >
              Agregar nueva nota
            </h2>
            <p className="text-xs text-petal-muted">
              Crea una nota manual asociada a tu cuenta de ClipSync
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#EDE8E0] transition-colors text-[#8C8681]"
            aria-label="Cerrar"
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
            <label className="block text-xs font-medium text-[#6B6560] mb-1">
              Título
            </label>
            <input
              type="text"
              placeholder="Ej. Resumen de reunión, Idea de proyecto..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-petal-border bg-petal-input focus:bg-white focus:border-petal-green outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6560] mb-1">
              Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all capitalize"
                    style={{
                      background: isActive ? "#4A7856" : "#EDE8E0",
                      color: isActive ? "#FFFFFF" : "#6B6560",
                      border: isActive ? "1px solid #4A7856" : "1px solid #E5DED0",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6560] mb-1">
              Contenido de la nota <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Escribe el contenido o recorte de texto aquí..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-petal-border bg-petal-input focus:bg-white focus:border-petal-green outline-none transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6560] mb-1">
              Etiquetas (separadas por coma)
            </label>
            <input
              type="text"
              placeholder="Ej. react, startups, figma"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-petal-border bg-petal-input focus:bg-white focus:border-petal-green outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6560] mb-1">
              Fuente / URL (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. https://miweb.com o Entrada manual"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-petal-border bg-petal-input focus:bg-white focus:border-petal-green outline-none transition-all"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-petal-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#6B6560] hover:bg-[#EDE8E0] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors shadow-sm disabled:opacity-50"
              style={{ background: "#4A7856" }}
            >
              {submitting ? "Guardando..." : "Guardar Nota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
