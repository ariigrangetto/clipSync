import { describe, expect, test, vi, beforeEach } from "vitest";

const { mockFrom, selectMock, eqIdMock, insertMock } = vi.hoisted(() => {
  const selectTerminal = vi.fn().mockResolvedValue({ data: [], error: null });
  const orderTerminal = vi.fn().mockResolvedValue({ data: [], error: null });
  const eqId = vi.fn().mockReturnValue({
    select: selectTerminal,
  });
  const insertFn = vi.fn().mockReturnValue({ select: selectTerminal });

  const fromMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ order: orderTerminal }),
    insert: insertFn,
    update: vi.fn().mockReturnValue({ eq: eqId }),
    delete: vi.fn().mockReturnValue({ eq: eqId }),
  });

  return {
    mockFrom: fromMock,
    selectMock: selectTerminal,
    eqIdMock: eqId,
    insertMock: insertFn,
  };
});

vi.mock("../../lib/supabaseClient.ts", () => ({
  supabase: {
    from: mockFrom,
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

import {
  fetchNotes,
  insertText,
  updateFavorite,
  updateTags,
  updateTitle,
  updateNote,
  updateCat,
  deleteNote,
} from "../../service/notesService.ts";

describe("Single-Instance Supabase Service Layer (No redundant getSupabaseClient / accessToken prop drilling)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("CRUD operations use the shared supabase client directly without passing accessToken to every function", async () => {
    await fetchNotes();
    expect(mockFrom).toHaveBeenCalledWith("Notes");

    await insertText({
      text: "Clean architecture note",
      tags: "clean, solid",
    });
    expect(insertMock).toHaveBeenCalledWith({
      title: null,
      tags: ["clean", "solid"],
      category: "article",
      text: "Clean architecture note",
      source: "Manual entry",
    });
    expect(selectMock).toHaveBeenCalled();

    await updateFavorite("note-1", true);
    expect(eqIdMock).toHaveBeenCalledWith("id", "note-1");

    await updateTags("note-1", ["tag1"]);
    expect(eqIdMock).toHaveBeenCalledWith("id", "note-1");

    await updateTitle("note-1", "New Title");
    expect(eqIdMock).toHaveBeenCalledWith("id", "note-1");

    await updateNote("Updated body", "note-1");
    expect(eqIdMock).toHaveBeenCalledWith("id", "note-1");

    await updateCat("note-1", "code");
    expect(eqIdMock).toHaveBeenCalledWith("id", "note-1");

    await deleteNote("note-1");
    expect(eqIdMock).toHaveBeenCalledWith("id", "note-1");
  });
});
