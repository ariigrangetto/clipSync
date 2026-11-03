import { useState, useEffect } from "react";
import { useUserToken } from "../hooks/useUserToken.ts";
import useNotes from "../hooks/useNotes.tsx";
import useNotification from "../hooks/useNotification.tsx";
import { FlowerIcon, ExternalLinkIcon } from "../components/Icons.tsx";
import { getTagPalette } from "../components/TagsColor.tsx";
import { getSafeHostname } from "../lib/url.ts";
import { Zap, Copy, Check, CircleAlert } from "lucide-react";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
declare const chrome: any;

export default function ExtensionPopup() {
    const { token, loading: authLoading } = useUserToken();
    const { notes, loading: notesLoading } = useNotes();
    const { showNotification } = useNotification();

    const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem("clipsync_autosave_enabled");
        return saved === null ? true : saved === "true";
    });

    const isAutoSaveActive = Boolean(token && autoSaveEnabled);

    const [copiedId, setCopiedId] = useState<string | null>(null);

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
        if (!token) {
            showNotification("User not logged in", true);
            return;
        }

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

    const latestNote = notes.length > 0 ? notes[0] : null;

    return (
        <div
            className="w-[430px] min-h-[360px] max-h-[500px] flex flex-col justify-between overflow-y-auto text-petal-text select-none text-left mx-auto"
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
                        background: isAutoSaveActive ? "#17231B" : "#1A1D1B",
                        borderColor: isAutoSaveActive ? "#2F5238" : "#2C322E",
                    }}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: isAutoSaveActive ? "#4ADE80" : "#7D7A73" }}
                                />
                                <span className="text-xs font-semibold text-petal-text">
                                    Auto-Save Selection
                                </span>
                            </div>
                            <p className="text-[10.5px] mt-0.5 text-petal-muted leading-tight">
                                {isAutoSaveActive
                                    ? "Active: Selected text on any web page will be saved"
                                    : "Paused: Free selection without automatic saving"}
                            </p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={toggleAutoSave}
                                disabled={!token}
                                title={
                                    !token
                                        ? "User not logged in"
                                        : isAutoSaveActive
                                            ? "Disable Auto-Save"
                                            : "Enable Auto-Save"
                                }
                                aria-label={
                                    !token
                                        ? "User not logged in"
                                        : isAutoSaveActive
                                            ? "Disable Auto-Save"
                                            : "Enable Auto-Save"
                                }
                                className={`w-10 h-5 rounded-full p-0.5 transition-all duration-200 ease-in-out relative shrink-0 ${!token ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                    }`}
                                style={{
                                    background: isAutoSaveActive ? "#5E9E6E" : "#3A403C",
                                }}
                            >
                                <span
                                    className="block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out"
                                    style={{
                                        transform: isAutoSaveActive ? "translateX(20px)" : "translateX(0px)",
                                    }}
                                />
                            </button>
                            {!token && (
                                <div
                                    className="flex items-center gap-1 text-[10px] text-red-400 font-medium animate-pulse select-none"
                                    role="status"
                                >
                                    <CircleAlert size={12} className="shrink-0 text-red-400" />
                                    <span className="whitespace-nowrap">User not logged in</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-semibold text-petal-text">
                                Latest Note
                            </h4>
                        </div>
                    </div>

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
                            <div
                                className="p-2.5 rounded-xl border animate-pulse space-y-1.5"
                                style={{ background: "#181B19", borderColor: "#2C322E" }}
                            >
                                <div className="h-3 bg-[#232825] rounded w-3/4" />
                                <div className="h-2 bg-[#232825] rounded w-1/2" />
                            </div>
                        </div>
                    ) : !latestNote ? (
                        <div
                            className="p-4 rounded-2xl border text-center space-y-1 text-petal-muted"
                            style={{ background: "#181B19", borderColor: "#2C322E" }}
                        >
                            <p className="text-xs text-petal-text">No notes yet</p>
                            <p className="text-[11px] text-petal-muted">
                                Highlight any text on a webpage to save it automatically.
                            </p>
                        </div>
                    ) : (
                        <div
                            className="p-3 rounded-xl border transition-all hover:border-[#3A423D] group relative"
                            style={{ background: "#181B19", borderColor: "#2C322E" }}
                        >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span
                                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                    style={{
                                        background: getTagPalette(latestNote.category || "article").bg,
                                        color: getTagPalette(latestNote.category || "article").text,
                                    }}
                                >
                                    {latestNote.category || "article"}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => handleCopy(latestNote.id, latestNote.text)}
                                    title="Copy to clipboard"
                                    className="p-1 rounded text-petal-muted hover:text-petal-text hover:bg-[#232825] transition-colors cursor-pointer"
                                >
                                    {copiedId === latestNote.id ? (
                                        <Check size={12} className="text-petal-green" />
                                    ) : (
                                        <Copy size={12} />
                                    )}
                                </button>
                            </div>

                            {latestNote.title && (
                                <p className="text-xs font-semibold text-petal-text truncate mb-1">
                                    {latestNote.title}
                                </p>
                            )}

                            <p className="text-[12px] text-petal-muted line-clamp-3 leading-relaxed">
                                {latestNote.text}
                            </p>

                            <div className="mt-2 flex items-center justify-between text-[10px] text-petal-muted">
                                <span className="truncate max-w-52" title={latestNote.source}>
                                    {getSafeHostname(latestNote.source, "Manual entry")}
                                </span>
                                <span>
                                    {new Date(latestNote.created_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}