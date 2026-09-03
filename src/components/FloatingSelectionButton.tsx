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
          background: "#181B19",
          color: "#EDEDEA",
          borderColor: "#2C322E",
          boxShadow: "0 8px 20px -4px rgba(0, 0, 0, 0.6)",
        }}
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#5E9E6E" }}
        >
          <FlowerIcon size={12} className="text-white" />
        </span>
        <span>Save in ClipSync</span>
      </button>
    </div>
  );
}
