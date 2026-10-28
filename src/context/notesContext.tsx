/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, createContext, useMemo } from "react";
import type { Note } from "../types/note.ts";
import {
    fetchNotes,
    insertText,
    deleteNote as apiDeleteNote,
    updateTags as apiUpdateTags,
    updateFavorite as apiUpdateFavorite,
    updateTitle as apiUpdateTitle,
    updateNote as apiUpdateNote,
    updateCat as apiUpdateCat,
    type InsertNoteParams,
} from "../service/notesService.ts";
import { supabase } from "../lib/supabaseClient.ts";
import useNotification from "../hooks/useNotification.tsx";
import { useUserToken } from "../hooks/useUserToken.ts";
import { getUserIdFromJwt } from "../lib/jwt.ts";

interface NotesContextType {
    notes: Note[];
    loading: boolean;
    addNote: (noteParams: InsertNoteParams) => Promise<{ success: boolean, error: string | null, data: Note | null }>;
    deleteNote: (id: string) => Promise<boolean>;
    toggleFavorite: (id: string) => Promise<void>;
    updateTags: (id: string, tags: string[]) => Promise<void>;
    updateTitle: (id: string, title: string) => Promise<void>;
    updateNote: (text: string, noteId: string) => Promise<{ success: boolean, error: string | null, data: Note | null }>;
    updateCat: (id: string, category: string) => Promise<void>;
    cat: string[];
}

export const NotesContext = createContext<NotesContextType | undefined>(undefined);

export default function NotesProvider({ children }: { children: React.ReactNode }) {
    const { token: accessToken, user, loading: authLoading } = useUserToken();
    const [rawNotes, setNotes] = useState<Note[]>([]);
    const [notesLoading, setNotesLoading] = useState<boolean>(true);
    const { showNotification } = useNotification();

    const notes = useMemo(() => (accessToken ? rawNotes : []), [accessToken, rawNotes]);
    const loading = authLoading || (Boolean(accessToken) && notesLoading);

    const cat = useMemo(() => {
        const categories = notes
            .map((n) => n.category)
            .filter((c) => Boolean(c) && typeof c === "string");
        return ["All", ...Array.from(new Set(categories))];
    }, [notes]);

    useEffect(() => {
        const userId = accessToken ? getUserIdFromJwt(accessToken) || user?.id || "" : "";
        if (authLoading || !accessToken || !userId) {
            return;
        }

        let isMounted = true;

        const loadInitialNotes = async (): Promise<void> => {
            const response = await fetchNotes();
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

        const changeFilter: Record<string, string> = {
            event: "*",
            schema: "public",
            table: "Notes",
            filter: `user_token=eq.${userId}`,
        };

        const channel = supabase
            .channel(`realtime:notes:${userId}`)
            .on(
                "postgres_changes",
                changeFilter as any,
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
            .subscribe((status: string, err: any) => {
                if (status === "SUBSCRIBED") {
                    console.log("[ClipSync Realtime] Subscribed to notes channel");
                } else if (status === "CHANNEL_ERROR") {
                    console.warn("[ClipSync Realtime] Channel error:", err);
                }
            });

        const handleSyncOnFocus = () => {
            if (document.visibilityState === "visible") {
                loadInitialNotes();
            }
        };

        window.addEventListener("focus", handleSyncOnFocus);
        document.addEventListener("visibilitychange", handleSyncOnFocus);

        return () => {
            isMounted = false;
            window.removeEventListener("focus", handleSyncOnFocus);
            document.removeEventListener("visibilitychange", handleSyncOnFocus);
            supabase.removeChannel(channel);
        };
    }, [accessToken, user?.id, authLoading, showNotification]);

    const addNote = useCallback(
        async (noteParams: InsertNoteParams): Promise<{ success: boolean, error: string | null, data: Note | null }> => {
            if (!accessToken) {
                showNotification("User is not authenticated", true);
                return { success: false, error: "No user authenticated", data: null };
            }
            const response = await insertText(noteParams);

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
                return { success: false, error: response.error || "Error saving note", data: null };
            }

        },
        [accessToken, showNotification]
    );

    const deleteNote = useCallback(
        async (id: string): Promise<boolean> => {
            if (!accessToken) {
                showNotification("User is not authenticated", true);
                return false;
            }

            const response = await apiDeleteNote(id);

            if (response.success) {
                setNotes((prev) => prev.filter((n) => n.id !== id));
                showNotification("Note deleted", false);
                return true;
            } else {
                showNotification("Error deleting note", true);
                return false;
            }
        },
        [accessToken, showNotification]
    );

    const toggleFavorite = useCallback(
        async (id: string): Promise<void> => {
            if (!accessToken) return showNotification("User is not authenticated", true);
            const targetNote = notes.find((n) => n.id === id);
            if (!targetNote) return;

            const newFavorite = !targetNote.favorite;

            const response = await apiUpdateFavorite(id, newFavorite);
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
        [accessToken, notes, showNotification]
    );

    const updateTags = useCallback(
        async (id: string, tags: string[]): Promise<void> => {
            if (!accessToken) return showNotification("User is not authenticated", true);
            const response = await apiUpdateTags(id, tags);
            if (response.success) {
                setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, tags } : n)));
                showNotification("Tags updated", false);
                return;

            } else {
                showNotification("Error updating tags", true);
                return;
            }
        },
        [accessToken, showNotification]
    );

    const updateTitle = useCallback(
        async (id: string, title: string): Promise<void> => {
            if (!accessToken) return showNotification("User is not authenticated", true);

            const response = await apiUpdateTitle(id, title);
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
        [accessToken, showNotification]
    );

    const updateNote = useCallback(
        async (text: string, noteId: string): Promise<{ success: boolean, error: string | null, data: Note | null }> => {
            if (!accessToken) {
                showNotification("User is not authenticated", true);
                return { success: false, error: "user not authenticated", data: null };
            }

            const response = await apiUpdateNote(text, noteId);

            if (response.success && response.data) {
                const updatedNote = response.data;
                setNotes(prev => prev.map((n) => n.id === noteId ? { ...n, text } : n));
                showNotification("Note updated", false);
                return { success: true, error: null, data: updatedNote };
            } else {
                showNotification(response.error || "Error updating note", true);
                return { success: false, error: response.error || "Error updating note", data: null };
            }
        },
        [accessToken, showNotification]
    );

    const updateCat = useCallback(async (id: string, category: string): Promise<void> => {
        if (!accessToken) return showNotification("User is not authenticated", true);

        const response = await apiUpdateCat(id, category);

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

    }, [accessToken, showNotification]);

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
            cat,
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
        cat,
    ]);
    return (
        <NotesContext.Provider value={value} >
            {children}
        </NotesContext.Provider>
    );
}
