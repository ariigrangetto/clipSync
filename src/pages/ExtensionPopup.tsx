import { useState, useEffect } from "react";
import { useUserToken } from "../hooks/useUserToken.ts";
import useNotes from "../hooks/useNotes.tsx";
import useNotification from "../hooks/useNotification.tsx";
import { FlowerIcon, ExternalLinkIcon } from "../components/Icons.tsx";
import { getTagPalette } from "../components/TagsColor.tsx";
import { Zap, Copy, Check, Plus, LogOut } from "lucide-react";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
declare const chrome: any;

export default function ExtensionPopup() {
    const { user, token, loading: authLoading, signOut } = useUserToken();
    const { notes, loading: notesLoading, addNote } = useNotes();
    const { showNotification } = useNotification();

    const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem("clipsync_autosave_enabled");
        return saved === null ? true : saved === "true";
    });

    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [quickNoteText, setQuickNoteText] = useState("");
    const [isAddingQuick, setIsAddingQuick] = useState(false);
    const [savingQuick, setSavingQuick] = useState(false);

    useEffect(() => {
        if (typeof chrome !== "undefined" && chrome?.storage?.local) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            chrome.storage.local.get(["clipsync_autosave_enabled"], (res: any) => {
                if (res?.clipsync_autosave_enabled !== undefined) {
                    setAutoSaveEnabled(res.clipsync_autosave_enabled);
                }
            });
        }
    }, []);

    const toggleAutoSave = () => {
        const newValue = !autoSaveEnabled;
        setAutoSaveEnabled(newValue);
        localStorage.setItem("clipsync_autosave_enabled", String(newValue));
        if (typeof chrome !== "undefined" && chrome?.storage?.local) {
            chrome.storage.local.set({ clipsync_autosave_enabled: newValue });
        }
        showNotification(newValue ? "Auto-Save is enabled" : "Auto-Save is disabled", false);
    };

    const handleCopy = async (noteId: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(noteId);
            showNotification("Copied to clipboard", false);
            setTimeout(() => setCopiedId(null), 1800);
        } catch {
            showNotification("Failed to copy", true);
        }
    };

    const APP_URL = (import.meta.env.VITE_APP_URL || "https://clipsyncc-ashen.vercel.app").replace(/\/$/, "");

    const openApp = (path: string = "/") => {
        const targetUrl = `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
        //verify if chrome object exists and has create API  
        if (typeof chrome !== "undefined" && chrome?.tabs?.create) {
            //if it pass, execute chrome.tabs.create wich is the native way to open a new tab in chrome
            chrome.tabs.create({ url: targetUrl });
        } else {
            //if it fail, use the old way (javaScript standard) to open a new tab in chrome
            window.open(targetUrl, "_blank");
        }
    };

    const handleOpenFullDashboard = () => openApp("/");
    const handleOpenLogin = () => openApp("/login");

    const handleQuickSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickNoteText.trim()) return;
        setSavingQuick(true);
        const res = await addNote({
            text: quickNoteText.trim(),
            source: "Extension Quick Note",
            category: "article",
            tags: ["quick", "extension"],
        });
        setSavingQuick(false);
        if (res.success) {
            setQuickNoteText("");
            setIsAddingQuick(false);
        }
    };

    const recentNotes = notes.slice(0, 4);

    return (
        <div
            className="w-full max-w-sm sm:w-95 min-h-125 max-h-150 flex flex-col justify-between overflow-y-auto text-petal-text select-none text-left mx-auto"
            style={{
                background: "#121413",
                fontFamily: "var(--font-body)",
                borderColor: "#2C322E",
            }}
        >
            <header
                className="px-4 py-3 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-md"
                style={{ borderColor: "#2C322E", background: "rgba(18, 20, 19, 0.95)" }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "#5E9E6E" }}
                    >
                        <FlowerIcon size={16} className="text-white" />
                    </div>
                    <div>
                        <span
                            className="text-sm font-semibold tracking-tight leading-none block"
                            style={{ fontFamily: "var(--font-display)", color: "#EDEDEA" }}
                        >
                            ClipSync
                        </span>
                        <span className="text-[10px] text-petal-muted leading-none">
                            Web Clipper Extension
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleOpenFullDashboard}
                    title="Open Full Dashboard in New Tab"
                    type="button"
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer"
                    style={{
                        background: "#181B19",
                        borderColor: "#2C322E",
                        color: "#7EC691",
                    }}
                >
                    <span>Open App</span>
                    <ExternalLinkIcon size={12} />
                </button>
            </header>

            <main className="p-4 space-y-3.5 flex-1">
                <div
                    className="p-3 rounded-2xl border transition-all"
                    style={{ background: "#181B19", borderColor: "#2C322E" }}
                >
                    <div className="flex items-start gap-2.5">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: "#1D3323", color: "#7EC691" }}
                        >
                            <Zap size={14} />
                        </div>
                        <div className="space-y-1 min-w-0">
                            <h3 className="text-xs font-medium text-petal-text">
                                Instant Note Syncing
                            </h3>
                            <p className="text-[11px] text-petal-muted leading-relaxed">
                                Highlight any text on any webpage to save and sync it automatically to your ClipSync account.
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="p-3.5 rounded-2xl border transition-all"
                    style={{
                        background: autoSaveEnabled ? "#17231B" : "#1A1D1B",
                        borderColor: autoSaveEnabled ? "#2F5238" : "#2C322E",
                    }}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: autoSaveEnabled ? "#4ADE80" : "#7D7A73" }}
                                />
                                <span className="text-xs font-semibold text-petal-text">
                                    Auto-Save Selection
                                </span>
                            </div>
                            <p className="text-[10.5px] mt-0.5 text-petal-muted leading-tight">
                                {autoSaveEnabled
                                    ? "Active: Selected text on any web page will be saved"
                                    : "Paused: Free selection without automatic saving"}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={toggleAutoSave}
                            title={autoSaveEnabled ? "Disable Auto-Save" : "Enable Auto-Save"}
                            className="w-10 h-5 rounded-full p-0.5 transition-all duration-200 ease-in-out cursor-pointer relative shrink-0"
                            style={{
                                background: autoSaveEnabled ? "#5E9E6E" : "#3A403C",
                            }}
                        >
                            <span
                                className="block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out"
                                style={{
                                    transform: autoSaveEnabled ? "translateX(20px)" : "translateX(0px)",
                                }}
                            />
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-semibold text-petal-text">
                                Latest Notes
                            </h4>
                            {token && notes.length > 0 && (
                                <span
                                    className="text-[10px] px-1.5 py-0.2 rounded-full font-medium"
                                    style={{ background: "#232825", color: "#88847C" }}
                                >
                                    {notes.length}
                                </span>
                            )}
                        </div>

                        {token && (
                            <button
                                type="button"
                                onClick={() => setIsAddingQuick(!isAddingQuick)}
                                className="text-[11px] text-petal-green hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <Plus size={12} />
                                <span>{isAddingQuick ? "Cancel" : "Add Note"}</span>
                            </button>
                        )}
                    </div>

                    {isAddingQuick && token && (
                        <form
                            onSubmit={handleQuickSave}
                            className="space-y-2 p-2.5 rounded-xl border animate-in fade-in duration-150"
                            style={{ background: "#181B19", borderColor: "#2C322E" }}
                        >
                            <textarea
                                autoFocus
                                value={quickNoteText}
                                onChange={(e) => setQuickNoteText(e.target.value)}
                                placeholder="Type a quick note..."
                                rows={2}
                                className="w-full text-xs bg-transparent border-none outline-none resize-none text-petal-text placeholder-[#6E6B65]"
                            />
                            <div className="flex justify-end gap-1.5">
                                <button
                                    type="submit"
                                    disabled={savingQuick || !quickNoteText.trim()}
                                    className="px-2.5 py-1 text-[11px] rounded-lg bg-petal-green text-white font-medium hover:bg-petal-green-hover transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {savingQuick ? "Saving..." : "Save Note"}
                                </button>
                            </div>
                        </form>
                    )}

                    {authLoading ? (
                        <div className="p-6 text-center text-xs text-petal-muted animate-pulse">
                            Loading session...
                        </div>
                    ) : !token ? (
                        <div
                            className="p-4 rounded-2xl border text-center space-y-2.5"
                            style={{ background: "#181B19", borderColor: "#2C322E" }}
                        >
                            <p className="text-xs text-petal-text font-medium">
                                Sign in to access your notebook
                            </p>
                            <p className="text-[11px] text-petal-muted max-w-xs mx-auto">
                                Log in to sync clippings across all devices and view your notes here.
                            </p>
                            <button
                                type="button"
                                onClick={handleOpenLogin}
                                className="w-full py-2 px-3 rounded-xl text-xs font-medium text-white shadow-sm transition-colors cursor-pointer"
                                style={{ background: "#5E9E6E" }}
                            >
                                Sign In / Create Account
                            </button>
                        </div>
                    ) : notesLoading ? (
                        <div className="space-y-2">
                            {[1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="p-2.5 rounded-xl border animate-pulse space-y-1.5"
                                    style={{ background: "#181B19", borderColor: "#2C322E" }}
                                >
                                    <div className="h-3 bg-[#232825] rounded w-3/4" />
                                    <div className="h-2 bg-[#232825] rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : recentNotes.length === 0 ? (
                        <div
                            className="p-4 rounded-2xl border text-center space-y-1 text-petal-muted"
                            style={{ background: "#181B19", borderColor: "#2C322E" }}
                        >
                            <p className="text-xs text-petal-text">No notes yet</p>
                            <p className="text-[11px] text-petal-muted">
                                Highlight any text on a webpage or click "+ Add Note" above.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentNotes.map((note) => {
                                const palette = getTagPalette(note.category || "article");
                                const hostname = note.source && note.source.startsWith("http")
                                    ? new URL(note.source).hostname
                                    : note.source || "Manual entry";

                                return (
                                    <div
                                        key={note.id}
                                        className="p-2.5 rounded-xl border transition-all hover:border-[#3A423D] group relative"
                                        style={{ background: "#181B19", borderColor: "#2C322E" }}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span
                                                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                style={{ background: palette.bg, color: palette.text }}
                                            >
                                                {note.category || "article"}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleCopy(note.id, note.text)}
                                                title="Copy to clipboard"
                                                className="p-1 rounded text-petal-muted hover:text-petal-text hover:bg-[#232825] transition-colors cursor-pointer"
                                            >
                                                {copiedId === note.id ? (
                                                    <Check size={12} className="text-petal-green" />
                                                ) : (
                                                    <Copy size={12} />
                                                )}
                                            </button>
                                        </div>

                                        {note.title && (
                                            <p className="text-xs font-semibold text-petal-text truncate mb-0.5">
                                                {note.title}
                                            </p>
                                        )}

                                        <p className="text-[11.5px] text-petal-muted line-clamp-2 leading-relaxed">
                                            {note.text}
                                        </p>

                                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-petal-muted">
                                            <span className="truncate max-w-40" title={note.source}>
                                                {hostname}
                                            </span>
                                            <span>
                                                {new Date(note.created_at).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <footer
                className="px-4 py-2.5 border-t flex items-center justify-between text-[11px] text-petal-muted"
                style={{ borderColor: "#2C322E", background: "#141615" }}
            >
                {user ? (
                    <div className="flex items-center justify-between w-full">
                        <span className="truncate max-w-55" title={user.email}>
                            {user.email}
                        </span>
                        <button
                            type="button"
                            onClick={() => signOut()}
                            title="Sign out"
                            className="text-[#F87171] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <LogOut size={11} />
                            <span>Sign out</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between w-full">
                        <span>Not signed in</span>
                        <button
                            type="button"
                            onClick={handleOpenLogin}
                            className="text-petal-green hover:underline cursor-pointer"
                        >
                            Log in
                        </button>
                    </div>
                )}
            </footer>
        </div>
    );
}