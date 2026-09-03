/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, createContext, useMemo } from "react";
import type { Note } from "../types/note.ts";
import {
    getSupabaseClient,
    fetchNotes,
    insertText,
    deleteNote as apiDeleteNote,
    updateTags as apiUpdateTags,
    updateFavorite as apiUpdateFavorite,
    updateTitle as apiUpdateTitle,
    updateNote as apiUpdateNote,
    updateCat as apiUpdateCat,
    type InsertNoteParams,
} from "../service/supabase";
import useNotification from "../hooks/useNotification.tsx";
import { useUserToken } from "../hooks/useUserToken.ts";

interface NotesContextType {
    notes: Note[];
    loading: boolean;
    addNote: (noteParams: Omit<InsertNoteParams, "userToken">) => Promise<{ success: boolean, error: string | null, data: Note | null }>;
    deleteNote: (id: string) => Promise<boolean>;
    toggleFavorite: (id: string) => Promise<void>;
    updateTags: (id: string, tags: string[]) => Promise<void>;
    updateTitle: (id: string, title: string) => Promise<void>;
    updateNote: (text: string, source?: string, noteId?: string) => Promise<{ success: boolean, error: string | null, data: Note | null }>;
    updateCat: (id: string, category: string) => Promise<void>;
    cat: string[];
}

export const NotesContext = createContext<NotesContextType | undefined>(undefined);

export default function NotesProvider({ children }: { children: React.ReactNode }) {
    const { token, loading: authLoading } = useUserToken();
    const [rawNotes, setNotes] = useState<Note[]>([]);
    const [notesLoading, setNotesLoading] = useState<boolean>(true);
    const { showNotification } = useNotification();

    const notes = useMemo(() => (token ? rawNotes : []), [token, rawNotes]);
    const loading = authLoading || (Boolean(token) && notesLoading);

    const cat = useMemo(() => {
        const categories = notes
            .map((n) => n.category)
            .filter((c) => Boolean(c) && typeof c === "string");
        //new Set para eliminar duplicados
        return ["All", ...Array.from(new Set(categories))];
    }, [notes]);

    useEffect(() => {
        if (authLoading || !token) {
            return;
        }

        let isMounted = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let channel: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let supabaseClient: any = null;

        const loadInitialNotes = async (): Promise<void> => {
            const response = await fetchNotes(token);
            if (isMounted) {
                if (response.success) {
                    setNotes(response.data);
                } else {
                    showNotification("Error loading notes", true);
                }
                setNotesLoading(false);
            }
        };

        loadInitialNotes();

        supabaseClient = getSupabaseClient(token);
        channel = supabaseClient
            .channel(`realtime:notes:${token}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "Notes",
                    filter: `user_token=eq.${token}`,
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (payload: any) => {
                    if (!isMounted) return;

                    if (payload.eventType === "INSERT") {
                        const newNote = payload.new as Note;
                        setNotes((prev) => {
                            if (prev.some((n) => n.id === newNote.id)) return prev;
                            return [newNote, ...prev];
                        });
                    } else if (payload.eventType === "UPDATE") {
                        const updatedNote = payload.new as Note;
                        setNotes((prev) =>
                            prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
                        );
                    } else if (payload.eventType === "DELETE") {
                        const oldNote = payload.old as { id: string };
                        setNotes((prev) => prev.filter((n) => n.id !== oldNote.id));
                    }
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            if (supabaseClient && channel) {
                supabaseClient.removeChannel(channel);
            }
        };
    }, [token, authLoading, showNotification]);

    const addNote = useCallback(
        async (noteParams: Omit<InsertNoteParams, "userToken">): Promise<{ success: boolean, error: string | null, data: Note | null }> => {
            if (!token) {
                showNotification("User is not authenticated", true);
                return { success: false, error: "No user authenticated", data: null };
            }
            const response = await insertText({ ...noteParams, userToken: token });

            if (response.success && response.data) {
                const newNote = response.data;

                setNotes((prev) => {
                    if (prev.some((n) => n.id === newNote.id)) return prev;
                    return [newNote, ...prev];
                });

                showNotification("Saved to ClipSync", false);
                return { success: true, error: null, data: response.data };
            } else {
                showNotification(response.error || "Error saving note", true);
                return { success: false, error: response.error || "Error al guardar la nota", data: null };
            }

        },
        [token, showNotification]
    );

    const deleteNote = useCallback(
        async (id: string): Promise<boolean> => {
            if (!token) {
                showNotification("User is not authenticated", true);
                return false;
            }

            const response = await apiDeleteNote(id, token);

            if (response.success) {
                setNotes((prev) => prev.filter((n) => n.id !== id));
                showNotification("Note deleted", false);
                return true;
            } else {
                showNotification("Error deleting note", true);
                return false;
            }
        },
        [token, showNotification]
    );

    const toggleFavorite = useCallback(
        async (id: string): Promise<void> => {
            if (!token) return showNotification("User is not authenticated", true);
            const targetNote = notes.find((n) => n.id === id);
            if (!targetNote) return;

            const newFavorite = !targetNote.favorite;

            const response = await apiUpdateFavorite(id, token, newFavorite);
            if (response.success) {
                // Actualización optimista
                setNotes((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, favorite: newFavorite } : n))
                );
                return;
            } else {
                showNotification("Error updating note", true);
                return;
            }
        },
        [token, notes, showNotification]
    );

    const updateTags = useCallback(
        async (id: string, tags: string[]): Promise<void> => {
            if (!token) return showNotification("User is not authenticated", true);
            const response = await apiUpdateTags(id, token, tags);
            if (response.success) {
                setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, tags } : n)));
                showNotification("Tags updated", false);
                return;

            } else {
                showNotification("Error updating tags", true);
                return;
            }
        },
        [token, showNotification]
    );

    const updateTitle = useCallback(
        async (id: string, title: string): Promise<void> => {
            if (!token) return showNotification("User is not authenticated", true);

            const response = await apiUpdateTitle(id, token, title);
            if (response.success && response.data) {
                const updatedNote = response.data;
                setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)));
                showNotification("Title updated successfully", false);
                return;

            } else {
                showNotification("Error updating note title", true);
                return;
            }
        },
        [token, showNotification]
    );

    const updateNote = useCallback(
        async (text: string, source?: string, noteId?: string): Promise<{ success: boolean, error: string | null, data: Note | null }> => {
            if (!token) {
                showNotification("User is not authenticated", true);
                return { success: false, error: "user not authenticated", data: null };
            }

            const response = await apiUpdateNote(token, text, source, noteId);

            if (response.success && response.data) {
                const updatedNote = response.data;
                setNotes((prev) =>
                    prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
                );
                showNotification("Note updated", false);
                return { success: true, error: null, data: updatedNote };
            } else {
                showNotification(response.error || "Error updating note", true);
                return { success: false, error: response.error || "Error al actualizar la nota", data: null };
            }
        },
        [token, showNotification]
    );

    const updateCat = useCallback(async (id: string, category: string): Promise<void> => {
        if (!token) return showNotification("User is not authenticated", true);

        const response = await apiUpdateCat(id, token, category);

        if (response.success && response.data) {
            const updatedNote = response.data;
            setNotes((prev) =>
                prev.map((n) => (n.id === id) ? updatedNote : n)
            )
            showNotification("Category updated successfully", false);
            return;
        } else {
            showNotification(response.error || "Error updating category", true);
            return;
        }

    }, [token, showNotification]);

    const value = useMemo(() => {
        return {
            notes,
            loading,
            addNote,
            deleteNote,
            toggleFavorite,
            updateTags,
            updateTitle,
            updateNote,
            updateCat,
            cat
        };
    }, [
        notes,
        loading,
        addNote,
        deleteNote,
        toggleFavorite,
        updateTags,
        updateTitle,
        updateNote,
        updateCat,
        cat
    ]);
    return (
        <NotesContext.Provider value={value} >
            {children}
        </NotesContext.Provider>
    );
}