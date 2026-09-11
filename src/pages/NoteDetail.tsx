import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import useNotes from "../hooks/useNotes.tsx";
import useNotification from "../hooks/useNotification.tsx";
import { FlowerIcon, HeartIcon, ExternalLinkIcon } from "../components/Icons.tsx";
import { getTagPalette } from "../components/TagsColor.tsx";
import { Edit } from "lucide-react";

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const { showNotification } = useNotification();
  const { notes, loading, updateTitle, updateTags, toggleFavorite, deleteNote, updateCat, updateNote } = useNotes();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditingTags, setIsEditingTags] = useState<boolean>(false);
  const [tagsInput, setTagsInput] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>("");
  const [isEditingCat, setIsEditingCat] = useState<boolean>(false);
  const [catInput, setCatInput] = useState<string>("");
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>("");

  const note = notes.find((n) => n.id.toString() === id);

  const handleUpdateText = useCallback(async (text: string) => {
    if (!note) return;
    await updateNote(text, note.id);
    setIsEditingText(false);
  }, [note, updateNote]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && isEditingText) {
        e.preventDefault();
        handleUpdateText(textInput);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditingText, textInput, handleUpdateText]);

  const handleEditNote = () => {
    setTextInput(note?.text ?? "");
    setIsEditingText(true);
  };


  const handleToggleFavorite = async () => {
    if (!note) return;
    await toggleFavorite(note.id);
  };

  async function handleUpdateTags(newTagsString?: string) {
    if (!note || newTagsString === undefined) return;
    const formatedTags = newTagsString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await updateTags(note.id, formatedTags);
    setIsEditingTags(false);
  }

  const handleStartEditTags = () => {
    setTagsInput(note?.tags && note.tags.length > 0 ? note.tags.join(", ") : "");
    setIsEditingTags(true);
  };

  const handleCopyText = async () => {
    if (!note) return;
    try {
      await navigator.clipboard.writeText(note.text);
      setCopied(true);
      showNotification("Copy to clipboard", false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showNotification("Error copying to clipboard", true);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    setIsDeleting(true);
    const res = await deleteNote(note.id);
    if (res) navigate("/");
    setIsDeleting(false);
  };

  const isUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  async function handleAddTitle(title: string) {
    if (!note) return;
    await updateTitle(note.id, title);
    setIsEditingTitle(false);
  }

  async function handleEditCategory(id: string, text: string) {
    await updateCat(id, text);
    setIsEditingCat(false);

  };

  const wordCount = note ? note.text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = note ? note.text.length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-petal-bg text-petal-text flex flex-col font-body">
      <header className="sticky top-0 z-20 bg-petal-bg/80 backdrop-blur-md border-b border-petal-border px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-petal-muted hover:text-petal-green transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-petal-green-light/50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span className="hidden sm:inline">Return</span>
            </Link>
            <div className="h-4 w-px bg-petal-border hidden sm:block" />
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group">
              <FlowerIcon className="logo-flower text-petal-green shrink-0" size={18} />
              <span className="font-display font-semibold text-base sm:text-lg text-petal-text">ClipSync</span>
            </Link>
          </div>

          {note && (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg border border-petal-border bg-petal-card hover:bg-[#252A27] hover:border-petal-green hover:text-petal-green transition-all cursor-pointer"
                title="Copy text">
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5E9E6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="hidden sm:inline">Copied</span>
                  </>

                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  handleEditNote()
                }}
                className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-petal-border bg-petal-card hover:bg-[#252A27] text-xs font-medium text-petal-text hover:border-petal-green hover:text-petal-green active:scale-95 transition-all duration-200 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-petal-green/20"
                title="Edit note"
              >
                <Edit size={14} className="transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6 text-petal-muted group-hover:text-petal-green" />
                <span className="hidden sm:inline">Edit</span>
              </button>

              <button
                onClick={handleToggleFavorite}
                className="p-1.5 sm:p-2 rounded-lg border border-petal-border bg-petal-card hover:bg-[#252A27] hover:border-petal-green transition-all cursor-pointer"
                style={{ color: note.favorite ? '#5E9E6E' : '#9E9B93' }}
                title={note.favorite ? "Remove from favorites" : "Mark as favorite"}
              >
                <HeartIcon size={16} filled={note.favorite} />
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 sm:p-2 rounded-lg border border-petal-border bg-petal-card text-red-400 hover:bg-red-950/40 hover:border-red-800 transition-all cursor-pointer"
                title="Delete note"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-10">
        {loading ? (
          <div className="bg-petal-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-petal-border shadow-sm animate-pulse space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-petal-border/50 rounded-full" />
              <div className="h-4 w-24 bg-petal-border/40 rounded" />
            </div>
            <div className="h-8 w-3/4 bg-petal-border/60 rounded" />
            <div className="space-y-3 pt-4">
              <div className="h-4 w-full bg-petal-border/40 rounded" />
              <div className="h-4 w-5/6 bg-petal-border/40 rounded" />
              <div className="h-4 w-4/6 bg-petal-border/40 rounded" />
            </div>
          </div>
        ) : !note ? (
          <div className="bg-petal-card rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-petal-border text-center max-w-md mx-auto my-8 sm:my-12">
            <div className="w-16 h-16 rounded-full bg-petal-green-light text-petal-green flex items-center justify-center mx-auto mb-4">
              <FlowerIcon size={32} />
            </div>
            <h2 className="font-display font-semibold text-xl text-petal-text mb-2">Note not found</h2>
            <p className="text-sm text-petal-muted mb-6">
              The note you are trying to view does not exist or has been deleted.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-petal-green text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-petal-green-hover transition-colors shadow-sm"
            >
              Return to Home
            </Link>
          </div>
        ) : (
          <article className="bg-petal-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 border border-petal-border shadow-sm relative overflow-hidden transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 mb-6 sm:mb-8 border-b border-petal-border">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <span
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium uppercase tracking-wider"
                  style={{
                    background: '#1A3323',
                    color: '#7EC691',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {isEditingCat ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleEditCategory(note.id, catInput);
                        setIsEditingCat(false);
                      }}
                      className="flex items-center gap-1.5 bg-petal-input border border-petal-green p-1 pl-3 rounded-full shadow-md transition-all w-fit max-w-full"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={catInput}
                        onChange={(e) => setCatInput(e.target.value)}
                        placeholder="Add category"
                        className="text-xs bg-transparent border-none outline-none w-28 sm:w-36 text-petal-text"
                        style={{ fontFamily: 'var(--font-body)' }}
                      />
                      <button
                        type="submit"
                        className="text-[10px] bg-petal-green text-white font-medium px-2.5 py-1 rounded-full hover:bg-petal-green-hover transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingCat(false)}
                        className="text-[10px] text-petal-muted hover:text-petal-text px-1.5 py-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </form>
                  ) : (
                    <>
                      <span>{note.category}</span>
                      <button className="cursor-pointer" onClick={() => setIsEditingCat(true)}>
                        <Edit size={14} />
                      </button>
                    </>
                  )}
                </span>


                <div className="flex items-center gap-2 text-xs text-petal-muted">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white"
                    style={{ backgroundColor: '#5E9E6E' }}
                  >
                    <FlowerIcon size={12} />
                  </div>
                  {note.source && isUrl(note.source) ? (
                    <a
                      href={note.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-petal-green hover:underline flex items-center gap-1 font-medium truncate max-w-[150px] sm:max-w-xs"
                    >
                      {new URL(note.source).hostname}
                      <ExternalLinkIcon size={12} />
                    </a>
                  ) : (
                    <span className="font-medium text-petal-text truncate max-w-[180px] sm:max-w-xs">{note.source || 'Manual Entry'}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 text-xs text-petal-muted">
                <span>{readingTime} min read</span>
                <span>•</span>
                <span>{new Date(note.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
              </div>
            </div>
            {note.title ? (
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-petal-text mb-4 sm:mb-6 leading-tight tracking-tight break-words">
                {note.title}
              </h1>
            ) : isEditingTitle ? (
              <div className="mb-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddTitle(titleInput);
                    setIsEditingTitle(false);
                  }}
                  className="flex items-center gap-1.5 bg-petal-input border border-petal-green p-1 pl-3 rounded-full shadow-md transition-all w-fit max-w-full"
                >
                  <input
                    type="text"
                    autoFocus
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="Add title"
                    className="text-xs bg-transparent border-none outline-none w-28 sm:w-36 text-petal-text"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                  <button
                    type="submit"
                    className="text-[10px] bg-petal-green text-white font-medium px-2.5 py-1 rounded-full hover:bg-petal-green-hover transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(false)}
                    className="text-[10px] text-petal-muted hover:text-petal-text px-1.5 py-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </form>
              </div>
            ) : (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setTitleInput(note.title || "");
                    setIsEditingTitle(true);
                  }}
                  className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium border border-dashed border-[#3A403C] hover:border-petal-green hover:bg-petal-green-light hover:text-petal-green transition-all cursor-pointer"
                  style={{
                    background: '#1A1E1C',
                    color: '#9E9B93',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.7rem',
                  }}
                >
                  + Add title
                </button>
              </div>
            )}
            <div className="mb-8 sm:mb-10">
              {isEditingText ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateText(textInput);
                  }}
                  className="space-y-4 animate-in fade-in duration-200"
                >
                  <div className="relative rounded-2xl border-2 border-petal-green/80 bg-[#141615] p-3 sm:p-4 md:p-5 shadow-sm transition-all focus-within:ring-4 focus-within:ring-petal-green/15 focus-within:border-petal-green">
                    <textarea
                      autoFocus
                      rows={note.category === "code" ? 8 : 5}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Write or edit the content of the note..."
                      className={`w-full bg-transparent border-none outline-none resize-y text-petal-text ${note.category === "code"
                        ? "font-mono text-sm leading-relaxed text-[#7EC691]"
                        : note.category === "quote"
                          ? "font-display text-lg sm:text-xl italic leading-relaxed"
                          : "font-body text-sm sm:text-base md:text-lg leading-relaxed"
                        }`}
                      style={{ lineHeight: "1.8" }}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingText(false)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-petal-muted hover:text-petal-text hover:bg-white/5 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-medium bg-petal-green text-white hover:bg-petal-green-hover transition-all shadow-sm cursor-pointer active:scale-95"
                    >
                      Save changes
                    </button>
                  </div>
                </form>
              ) : note.category === "code" ? (
                <div className="relative group">
                  <div className="absolute right-3 top-3 z-10">
                    <button
                      onClick={handleCopyText}
                      className="text-xs px-2.5 py-1 rounded bg-[#1A1E1C] hover:bg-[#232825] text-petal-green font-medium border border-petal-border shadow-xs backdrop-blur transition-all cursor-pointer"
                    >
                      {copied ? "Copied!" : "Copy Code"}
                    </button>
                  </div>
                  <pre
                    className="text-xs sm:text-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 overflow-x-auto border border-petal-green/20"
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
                      color: '#7EC691',
                      background: '#14261B',
                      lineHeight: '1.75',
                    }}
                  >
                    <code>{note.text}</code>
                  </pre>
                </div>
              ) : note.category === "quote" ? (
                <blockquote className="my-4 pl-4 sm:pl-6 border-l-4 border-petal-green py-2">
                  <p
                    className="text-lg sm:text-xl md:text-2xl leading-relaxed italic text-petal-text break-words"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    "{note.text}"
                  </p>
                </blockquote>
              ) : (
                <div
                  className="text-sm sm:text-base md:text-lg leading-relaxed text-petal-text whitespace-pre-wrap font-normal break-words"
                  style={{ lineHeight: '1.8' }}
                >
                  {note.text}
                </div>
              )
              }
            </div>

            <div className="pt-5 sm:pt-6 border-t border-petal-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {note.tags && note.tags.length > 0 ? (
                  <>
                    <span className="text-xs text-petal-muted font-medium mr-1">Tags:</span>
                    {note.tags.map((tag) => {
                      const palette = getTagPalette(tag);
                      return (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{
                            background: palette.bg,
                            color: palette.text,
                          }}
                        >
                          #{tag}
                        </span>
                      );
                    })}
                    <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1E2220] hover:border-petal-green hover:text-petal-green border border-petal-border transition-all cursor-pointer"
                      onClick={handleStartEditTags}>
                      <Edit size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStartEditTags}
                    className="text-xs px-2.5 py-1 rounded-full font-medium border border-dashed border-[#3A403C] hover:border-petal-green hover:bg-petal-green-light hover:text-petal-green transition-all cursor-pointer"
                    style={{
                      background: '#1A1E1C',
                      color: '#9E9B93',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.7rem',
                    }}
                  >
                    + Add tags
                  </button>
                )}
                {isEditingTags && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateTags(tagsInput);
                    }}
                    className="flex items-center gap-1.5 bg-[#181C1A] border border-petal-green p-1 pl-3 rounded-full shadow-md transition-all max-w-full"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="react, css, figma..."
                      className="text-xs bg-transparent border-none outline-none w-28 sm:w-36 text-petal-text"
                      style={{ fontFamily: 'var(--font-body)' }}
                    />
                    <button
                      type="submit"
                      className="text-[10px] bg-petal-green text-white font-medium px-2.5 py-1 rounded-full hover:bg-petal-green-hover transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTags(false)}
                      className="text-[10px] text-petal-muted hover:text-petal-text px-1.5 py-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </form>
                )}
              </div>

              <div className="text-xs text-petal-muted flex items-center gap-3">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} characters</span>
              </div>
            </div>
          </article>
        )}
      </main>
    </div >
  );
}
