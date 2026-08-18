import { useEffect, useRef } from "react";
import { FlowerIcon } from "./Icons";

interface FloatingSelectionButtonProps {
  selectedText: string;
  position: { top: number; left: number } | null;
  onSave: () => void;
  onClose: () => void;
}

export default function FloatingSelectionButton({
  selectedText,
  position,
  onSave,
  onClose,
}: FloatingSelectionButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!position || !selectedText) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 transition-all duration-200 ease-out animate-in fade-in zoom-in-95"
      style={{
        top: `${Math.max(10, position.top - 46)}px`,
        left: `${Math.max(10, position.left)}px`,
      }}
    >
      <button
        onClick={onSave}
        type="button"
        title="Save in ClipSync"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg border text-xs font-medium cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
        style={{
          background: "#1C1914",
          color: "#FAFAF7",
          borderColor: "rgba(255, 255, 255, 0.15)",
          boxShadow: "0 8px 20px -4px rgba(28, 25, 20, 0.35)",
        }}
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#4A7856" }}
        >
          <FlowerIcon size={12} className="text-white" />
        </span>
        <span>Save in ClipSync</span>
      </button>
    </div>
  );
}
