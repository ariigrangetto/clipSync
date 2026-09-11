import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Note } from "../types/note.ts";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Cache client instances by token to prevent GoTrueClient duplication and memory leaks
const clientCache = new Map<string, SupabaseClient>();

// RLS con encabezado HTTP personalizado
export function getSupabaseClient(userToken: string): SupabaseClient {
  const cached = clientCache.get(userToken);
  if (cached) {
    return cached;
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-user-token": userToken,
      },
    },
  });

  clientCache.set(userToken, client);
  return client;
}

export interface InsertNoteParams {
  text: string;
  source?: string;
  tags?: string[] | string;
  category?: string;
  userToken: string;
  title?: string;
}

export async function insertText(params: InsertNoteParams): Promise<{ success: boolean, error: string | null, data: Note | null }> {
  const token = params.userToken;
  if (!token) {
    return { error: "No user token provided", success: false, data: null };
  }

  const formattedTags = Array.isArray(params.tags)
    ? params.tags
    : typeof params.tags === "string"
      ? params.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  const supabase = getSupabaseClient(token);

  const { data, error } = await supabase
    .from("Notes")
    .insert({
      title: params.title || null,
      tags: formattedTags,
      category: params.category || "article",
      text: params.text,
      source: params.source || "Manual entry",
      user_token: token,
    })
    .select();

  if (error) {
    console.error("Error inserting note:", error);
    return { error: error.message, success: false, data: null };
  }

  return { success: true, error: null, data: data?.[0] as Note };
}

export async function fetchNotes(userToken: string) {
  if (!userToken) {
    return { success: false, error: "No user token provided", data: [] };
  }

  const supabase = getSupabaseClient(userToken);

  const { data, error } = await supabase
    .from("Notes")
    .select("*")
    .eq("user_token", userToken)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, error: null, data: (data as Note[]) || [] };
}

export async function deleteNote(id: string, userToken: string): Promise<{ success: boolean, error: string | null }> {
  const supabase = getSupabaseClient(userToken);
  const { error } = await supabase
    .from("Notes")
    .delete()
    .eq("id", id)
    .eq("user_token", userToken)
    .select();

  if (error) {
    console.error("Error deleting note:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function updateFavorite(id: string, userToken: string, favorite: boolean): Promise<{ success: boolean, error: string | null, data: Note | null }> {
  const supabase = getSupabaseClient(userToken);
  const { data, error } = await supabase
    .from("Notes")
    .update({ favorite })
    .eq("id", id)
    .eq("user_token", userToken)
    .select();

  if (error) {
    console.error("Error updating favorite:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, error: null, data: data?.[0] as Note };
}



export async function updateTags(id: string, userToken: string, tags: string[]): Promise<{ success: boolean, error: string | null, data: Note | null }> {
  if (!userToken || !id) {
    return { success: false, error: "Token or ID missing", data: null };
  };

  const supabase = getSupabaseClient(userToken);

  const { data, error } = await supabase
    .from("Notes")
    .update({ tags })
    .eq("id", id)
    .eq("user_token", userToken)
    .select();

  if (error) {
    console.error("Error updating note tags:", error);
    return { success: false, error: error.message, data: null };
  };

  return { success: true, error: null, data: data?.[0] as Note };

}

export async function updateTitle(id: string, userToken: string, title: string): Promise<{ success: boolean, error: string | null, data: Note | null }> {
  if (!userToken || !id) {
    return { success: false, error: "Token or ID missing", data: null };
  }

  const supabase = getSupabaseClient(userToken);

  const { data, error } = await supabase
    .from("Notes")
    .update({ title })
    .eq("id", id)
    .eq("user_token", userToken)
    .select();

  if (error) {
    console.error("Error updating note title:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, error: null, data: data?.[0] as Note };
};

export async function updateNote(userToken: string, text: string, noteId?: string): Promise<{ success: boolean, error: string | null, data: Note | null }> {
  if (!userToken || !noteId) {
    return { success: false, error: "Token or ID missing", data: null };
  }

  const supabase = getSupabaseClient(userToken);

  const { data, error } = await supabase.from("Notes")
    .update({ text: text })
    .eq("user_token", userToken)
    .eq("id", noteId)
    .select();

  if (error) {
    console.error("Error updating note:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, error: null, data: data?.[0] as Note };
}


export async function updateCat(id: string, userToken: string, category: string): Promise<{ success: boolean, error: string | null, data: Note | null }> {
  if (!userToken || !id) {
    return { success: false, error: "Token or ID missing", data: null };
  }

  const supabase = getSupabaseClient(userToken);

  const { data, error } = await supabase
    .from("Notes")
    .update({ category })
    .eq("id", id)
    .eq("user_token", userToken)
    .select();

  if (error) {
    console.error("Error updating note category:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, error: null, data: data?.[0] as Note };
};