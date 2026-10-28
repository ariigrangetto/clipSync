import type { Note } from "../types/note.ts";
import { supabase } from "../lib/supabase.ts";

export interface InsertNoteParams {
  text: string;
  source?: string;
  tags?: string[] | string;
  category?: string;
  title?: string;
}

export async function insertText(
  params: InsertNoteParams
): Promise<{ success: boolean; error: string | null; data: Note | null }> {
  const formattedTags = Array.isArray(params.tags)
    ? params.tags
    : typeof params.tags === "string"
      ? params.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  const { data, error } = await supabase
    .from("Notes")
    .insert({
      title: params.title || null,
      tags: formattedTags,
      category: params.category || "article",
      text: params.text,
      source: params.source || "Manual entry",
    })
    .select();

  if (error) {
    console.error("Error inserting note:", error);
    return { error: error.message, success: false, data: null };
  }

  return { success: true, error: null, data: data?.[0] as Note };
}

export async function fetchNotes(): Promise<{
  success: boolean;
  error: string | null;
  data: Note[];
}> {
  const { data, error } = await supabase
    .from("Notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, error: null, data: (data as Note[]) || [] };
}

export async function deleteNote(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  if (!id) {
    return { success: false, error: "ID missing" };
  }

  const { error } = await supabase.from("Notes").delete().eq("id", id).select();

  if (error) {
    console.error("Error deleting note:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function updateFavorite(
  id: string,
  favorite: boolean
): Promise<{ success: boolean; error: string | null; data: Note | null }> {
  if (!id) {
    return { success: false, error: "ID missing", data: null };
  }

  const { data, error } = await supabase
    .from("Notes")
    .update({ favorite })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating favorite:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, error: null, data: data?.[0] as Note };
}

export async function updateTags(
  id: string,
  tags: string[]
): Promise<{ success: boolean; error: string | null; data: Note | null }> {
  if (!id) {
    return { success: false, error: "ID missing", data: null };
  }

  const { data, error } = await supabase
    .from("Notes")
    .update({ tags })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating note tags:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, error: null, data: data?.[0] as Note };
}

export async function updateTitle(
  id: string,
  title: string
): Promise<{ success: boolean; error: string | null; data: Note | null }> {
  if (!id) {
    return { success: false, error: "ID missing", data: null };
  }

  const { data, error } = await supabase
    .from("Notes")
    .update({ title })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating note title:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, error: null, data: data?.[0] as Note };
}

export async function updateNote(
  text: string,
  noteId?: string
): Promise<{ success: boolean; error: string | null; data: Note | null }> {
  if (!noteId) {
    return { success: false, error: "ID missing", data: null };
  }

  const { data, error } = await supabase
    .from("Notes")
    .update({ text })
    .eq("id", noteId)
    .select();

  if (error) {
    console.error("Error updating note:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, error: null, data: data?.[0] as Note };
}

export async function updateCat(
  id: string,
  category: string
): Promise<{ success: boolean; error: string | null; data: Note | null }> {
  if (!id) {
    return { success: false, error: "ID missing", data: null };
  }

  const { data, error } = await supabase
    .from("Notes")
    .update({ category })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating note category:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, error: null, data: data?.[0] as Note };
}
