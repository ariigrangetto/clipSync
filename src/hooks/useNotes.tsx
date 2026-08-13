import { useContext } from "react";
import { NotesContext } from "../context/notesContext.tsx";

export default function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes debe ser usado dentro de un NotesProvider");
  }
  return context;
}