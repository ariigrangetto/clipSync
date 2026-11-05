import { useState, useEffect, type CSSProperties } from "react";
import useNotification from "../hooks/useNotification.tsx";
import { FlowerIcon, PlusIcon, SearchIcon, GridIcon, HeartIcon, KeyIcon, MenuIcon, CloseIcon } from "../components/Icons.tsx";
import { PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import NoteCard from "../components/NoteCard.tsx";
import AddNoteModal from "../components/AddNoteModal.tsx";
import { useUserToken } from "../hooks/useUserToken.ts";
import useNotes from "../hooks/useNotes.tsx";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
declare const chrome: any;

export default function Dashboard() {
    const { notes, loading: notesLoading, addNote, deleteNote, toggleFavorite, updateNote, cat } = useNotes();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [activeNav, setActiveNav] = useState(0);
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [searchFocused, setSearchFocused] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
        const saved = localStorage.getItem("clipsync_sidebar_open");
        return saved === null ? true : saved === "true";
    });
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPasswordResetSuccess, setShowPasswordResetSuccess] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        const fromSession = sessionStorage.getItem("clipsync_password_reset_success") === "true";
        const fromState = Boolean(location.state && (location.state as { passwordResetSuccess?: boolean }).passwordResetSuccess);

        if (fromSession) {
            sessionStorage.removeItem("clipsync_password_reset_success");
        }
        return fromSession || fromState;
    });

    useEffect(() => {
        if (!showPasswordResetSuccess) return;

        if (location.state && (location.state as { passwordResetSuccess?: boolean }).passwordResetSuccess) {
            navigate(location.pathname, { replace: true, state: {} });
        }

        const timer = setTimeout(() => {
            setShowPasswordResetSuccess(false);
        }, 4500);

        return () => clearTimeout(timer);
    }, [showPasswordResetSuccess, location.pathname, location.state, navigate]);
    const { user, signOut, loading: userLoading } = useUserToken();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const isLoading = notesLoading || userLoading;

    const handleLogout = async () => {
        setIsMobileMenuOpen(false);
        setIsLoggingOut(true);

        try {
            await signOut();
        } finally {
            navigate("/login");
        }
    };

    // Auto-save state
    const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem("clipsync_autosave_enabled");
        return saved === null ? true : saved === "true";
    });

    const toggleAutoSaveEnabled = () => {
        const next = !autoSaveEnabled;
        setAutoSaveEnabled(next);
        localStorage.setItem("clipsync_autosave_enabled", String(next));

        if (typeof chrome !== "undefined" && chrome?.storage?.local) {
            chrome.storage.local.set({ clipsync_autosave_enabled: next });
        }

        showNotification(
            next ? "Auto-save enabled: selections will be captured" : "Auto-save disabled: select text freely",
            false
        );
    };

    const favoriteCount = notes.filter(n => n.favorite).length;

    const NAV_ITEMS = [
        { label: 'All Notes', icon: GridIcon, count: notes.length },
        { label: 'Favorites', icon: HeartIcon, count: favoriteCount },
    ];

    const filteredNotes = notes.filter(n => {
        const matchesCategory =
            activeCategory === "All" ||
            (n.category && n.category.toLowerCase() === activeCategory.toLowerCase());

        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !query ||
            (n.title && n.title.toLowerCase().includes(query)) ||
            (n.text && n.text.toLowerCase().includes(query)) ||
            (Array.isArray(n.tags) && n.tags.some((t: string) => t.toLowerCase().includes(query)));

        const matchesNav =
            activeNav === 0 ||
            (activeNav === 1 && n.favorite);

        return matchesCategory && matchesSearch && matchesNav;
    });

    useEffect(() => {
        function handlePointerUp() {
            if (!autoSaveEnabled) return;

            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) return;

            const selectedText = selection.toString().trim();
            if (selectedText.length < 3) return;

            const alreadyExists = notes.some(n => n.text === selectedText);
            if (alreadyExists) return;

            const isCodeBlock =
                selection.anchorNode?.parentElement?.tagName === 'CODE' ||
                selection.anchorNode?.parentElement?.tagName === 'PRE';

            const defaultTitle = isCodeBlock
                ? 'Code snippet'
                : selectedText.slice(0, 50) + (selectedText.length > 50 ? '...' : '');

            const category = isCodeBlock ? 'code' : 'general';

            if (typeof chrome !== "undefined" && chrome?.storage?.local) {
                chrome.storage.local.get(["clipsync_notes"], (result: { clipsync_notes?: any[] }) => {
                    const currentNotes = result.clipsync_notes || [];
                    const newNote = {
                        id: crypto.randomUUID(),
                        title: defaultTitle,
                        text: selectedText,
                        category,
                        tags: [],
                        source: window.location.hostname || "Web page",
                        url: window.location.href,
                        created_at: new Date().toISOString(),
                        favorite: false
                    };
                    chrome.storage.local.set({ clipsync_notes: [newNote, ...currentNotes] });
                });
            } else {
                addNote({
                    title: defaultTitle,
                    text: selectedText,
                    category,
                    tags: [],
                    source: "Dashboard Web"
                });
            }

            showNotification('Clipping saved automatically', false);

            const activeElement = document.activeElement as HTMLElement | null;
            const isInsideInput = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable
            );

            if (!isInsideInput) {
                try {
                    selection.removeAllRanges();
                } catch {
                    // ignore if already cleared
                }
            }
        }

        window.addEventListener("mouseup", handlePointerUp);
        return () => window.removeEventListener("mouseup", handlePointerUp);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSaveEnabled, addNote, updateNote, notes]);

    return (
        <>
            <div
                className="flex h-screen overflow-hidden text-petal-text"
                style={{ background: '#0F1110', fontFamily: 'var(--font-body)' }}
            >
                {/* Mobile sidebar backdrop overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] flex flex-col shrink-0 border-r transition-all duration-200 ease-in-out md:static ${
                        isSidebarOpen
                            ? "md:w-60 md:translate-x-0"
                            : "md:w-0 md:-translate-x-full md:border-r-0 md:opacity-0 pointer-events-none md:pointer-events-none"
                    } ${
                        isMobileMenuOpen ? "translate-x-0 shadow-2xl pointer-events-auto" : "-translate-x-full md:translate-x-0"
                    } overflow-hidden`}
                    style={{
                        background: '#141715',
                        borderColor: '#242A26',
                    }}
                >
                    {/* Brand Header */}
                    <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                style={{ background: '#5E9E6E' }}
                            >
                                <FlowerIcon size={18} className="logo-flower" style={{ color: '#ffffff' } as CSSProperties} />
                            </div>
                            <span
                                className="text-base font-medium tracking-tight whitespace-nowrap text-[#EDEDEA]"
                                style={{ fontFamily: 'var(--font-display)' }}
                            >
                                ClipSync
                            </span>
                        </div>
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="md:hidden p-1 rounded-lg text-petal-muted hover:text-petal-text hover:bg-[#232825] cursor-pointer"
                                aria-label="Close navigation"
                            >
                                <CloseIcon size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSidebarOpen(false);
                                    localStorage.setItem("clipsync_sidebar_open", "false");
                                }}
                                className="hidden md:flex p-1.5 rounded-lg text-petal-muted hover:text-petal-text hover:bg-white/5 transition-colors cursor-pointer"
                                aria-label="Collapse sidebar"
                                title="Collapse sidebar"
                            >
                                <PanelLeftClose size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-3 space-y-1">
                        {NAV_ITEMS.map((item, i) => {
                            const Icon = item.icon;
                            const isActive = activeNav === i;
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        setActiveNav(i);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer group"
                                    style={{
                                        background: isActive ? '#1F3425' : 'transparent',
                                        color: isActive ? '#88D99E' : '#9E9B93',
                                        fontSize: '0.825rem',
                                        fontWeight: isActive ? 500 : 400,
                                    }}
                                >
                                    <Icon size={15} />
                                    <span className="flex-1 group-hover:text-[#EDEDEA] transition-colors">{item.label}</span>
                                    {item.count !== null && (
                                        <span
                                            className="text-xs rounded-md px-1.5 py-0.5 min-w-5 text-center font-medium"
                                            style={{
                                                background: isActive ? '#284631' : '#1F2421',
                                                color: isActive ? '#B5EAC5' : '#7D7A73',
                                                fontSize: '0.68rem',
                                            }}
                                        >
                                            {item.label === 'Favorites' ? favoriteCount : item.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Auto-save Switch Module */}
                    <div
                        className="mx-3 mb-3 p-3 rounded-2xl transition-all duration-200 border"
                        style={{
                            background: autoSaveEnabled ? 'linear-gradient(180deg, #18271C 0%, #141E17 100%)' : '#1A1E1C',
                            borderColor: autoSaveEnabled ? '#2C4933' : '#272E29',
                        }}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0"
                                    style={{
                                        background: autoSaveEnabled ? '#5E9E6E' : '#2F3632',
                                        color: '#FFFFFF',
                                    }}
                                >
                                    <FlowerIcon size={14} />
                                </div>
                                <div className="truncate">
                                    <p className="text-xs font-medium leading-tight truncate text-[#EDEDEA]">
                                        Auto-save
                                    </p>
                                    <p className="text-[10px] font-medium mt-0.5 truncate" style={{ color: autoSaveEnabled ? '#7EC691' : '#7D7A73' }}>
                                        {autoSaveEnabled ? 'Enabled' : 'Disabled'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={toggleAutoSaveEnabled}
                                title={autoSaveEnabled ? 'Disable auto-save' : 'Enable auto-save'}
                                aria-label={autoSaveEnabled ? 'Disable auto-save' : 'Enable auto-save'}
                                className="w-9 h-5 rounded-full p-0.5 transition-all duration-200 ease-in-out cursor-pointer relative shrink-0"
                                style={{
                                    background: autoSaveEnabled ? '#5E9E6E' : '#333B36',
                                }}
                            >
                                <span
                                    className="block w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out"
                                    style={{
                                        transform: autoSaveEnabled ? 'translateX(16px)' : 'translateX(0px)',
                                    }}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Quick Hint */}
                    <div
                        className="mx-3 mb-3 p-2.5 rounded-xl border border-dashed"
                        style={{ background: '#131A15', borderColor: '#24382A' }}
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles size={12} className="text-[#7EC691]" />
                            <span className="text-[11px] font-medium text-[#7EC691]">
                                Capture Module
                            </span>
                        </div>
                        <p style={{ color: '#889E90', fontSize: '0.67rem', lineHeight: 1.45 }}>
                            {autoSaveEnabled ? 'Select text anywhere on the web to clip automatically.' : 'Auto-save paused. Select text freely.'}
                        </p>
                    </div>

                    {/* Authenticated User */}
                    <div
                        className="mx-3 mb-4 p-2.5 rounded-xl border"
                        style={{ background: '#191D1A', borderColor: '#262D28' }}
                    >
                        <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <KeyIcon size={13} style={{ color: '#5E9E6E' } as CSSProperties} className="shrink-0" />
                                <div className="truncate">
                                    <span className="text-xs font-medium block truncate text-[#EDEDEA]">
                                        Authenticated User
                                    </span>
                                    {user?.email && (
                                        <span className="text-[10px] text-petal-muted block truncate" title={user.email}>
                                            {user.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                title="Sign out"
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer hover:bg-red-950/60 disabled:opacity-50"
                                style={{ background: '#2B1717', color: '#F87171', fontSize: '0.66rem' }}
                            >
                                {isLoggingOut ? (
                                    <span className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 border border-[#F87171] border-t-transparent rounded-full animate-spin" />
                                        <span>...</span>
                                    </span>
                                ) : (
                                    <span>Logout</span>
                                )}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#101211]">
                    {/* Header */}
                    <header
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 border-b shrink-0"
                        style={{ borderColor: '#222824', background: 'rgba(16, 18, 17, 0.85)', backdropFilter: 'blur(10px)' }}
                    >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden p-2 -ml-1 rounded-xl text-petal-muted hover:text-petal-text hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                                aria-label="Open navigation menu"
                            >
                                <MenuIcon size={20} />
                            </button>
                            {!isSidebarOpen && (
                                <div className="hidden md:flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSidebarOpen(true);
                                            localStorage.setItem("clipsync_sidebar_open", "true");
                                        }}
                                        className="p-2 -ml-1 rounded-xl text-petal-muted hover:text-petal-text hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                                        aria-label="Expand sidebar"
                                        title="Expand sidebar"
                                    >
                                        <PanelLeftOpen size={20} />
                                    </button>
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                                        style={{ background: '#5E9E6E' }}
                                        title="ClipSync"
                                    >
                                        <FlowerIcon size={16} className="logo-flower" style={{ color: '#ffffff' } as CSSProperties} />
                                    </div>
                                </div>
                            )}
                            <div>
                                <h1
                                    className="text-lg sm:text-xl leading-tight font-medium tracking-tight text-[#EDEDEA]"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    {activeNav === 1 ? 'Favorites' : 'My Clippings'}
                                </h1>
                                <p style={{ color: '#8A867E', fontSize: '0.73rem', marginTop: 1 }}>
                                    {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 flex-1 sm:flex-initial"
                                style={{
                                    background: searchFocused ? '#181C19' : '#141715',
                                    borderColor: searchFocused ? '#5E9E6E' : '#29302B',
                                }}
                            >
                                <SearchIcon size={14} style={{ color: '#8A867E' } as CSSProperties} className="shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search notes, tags..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                    className="bg-transparent text-xs w-full sm:w-36 md:w-48 focus:sm:w-60 outline-none placeholder-[#6E6B65] transition-all"
                                    style={{ color: '#EDEDEA' }}
                                />
                            </div>

                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white shadow-xs transition-all duration-150 hover:opacity-90 active:scale-95 cursor-pointer shrink-0"
                                style={{ background: '#5E9E6E' }}
                            >
                                <PlusIcon size={14} />
                                <span>New Note</span>
                            </button>
                        </div>
                    </header>

                    {/* Filter Pills */}
                    <div
                        className="px-4 sm:px-6 md:px-8 py-2.5 border-b flex items-center justify-between gap-4"
                        style={{ borderColor: '#222824', background: '#131614' }}
                    >
                        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar w-full">
                            {cat.map(c => {
                                const isCatActive = activeCategory === c;
                                return (
                                    <button
                                        key={c}
                                        onClick={() => setActiveCategory(c)}
                                        className="px-3 py-1 rounded-lg text-xs transition-all duration-150 capitalize whitespace-nowrap cursor-pointer shrink-0 ring-1 ring-inset"
                                        style={{
                                            background: isCatActive ? '#203626' : 'transparent',
                                            color: isCatActive ? '#88D99E' : '#8A867E',
                                            borderColor: isCatActive ? 'rgba(94, 158, 110, 0.3)' : 'transparent',
                                            fontWeight: isCatActive ? 500 : 400,
                                        }}
                                    >
                                        {c}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Grid / Body Area */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                        {isLoading ? (
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium mb-5" style={{ color: '#7EC691' }}>
                                    <div className="w-4 h-4 border-2 border-petal-green border-t-transparent rounded-full animate-spin" />
                                    <span>Loading your clippings...</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div
                                            key={i}
                                            className="p-5 rounded-2xl animate-pulse flex flex-col justify-between h-48 border"
                                            style={{ background: '#161917', borderColor: '#242A26' }}
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="h-3 bg-[#262C28] rounded-md w-24" />
                                                    <div className="h-3 bg-[#262C28] rounded-full w-12" />
                                                </div>
                                                <div className="h-4 bg-[#262C28] rounded-md w-3/4" />
                                                <div className="h-3 bg-[#5E9E6E] opacity-25 rounded-md w-full" />
                                                <div className="h-3 bg-[#5E9E6E] opacity-20 rounded-md w-2/3" />
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                <div className="h-3 bg-[#262C28] rounded-md w-14" />
                                                <div className="h-4 bg-[#262C28] rounded-md w-16" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : filteredNotes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[340px] text-center max-w-sm mx-auto px-4 py-12">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-emerald-500/20 shadow-lg shadow-black/40"
                                    style={{ background: '#172B1E' }}
                                >
                                    <FlowerIcon size={26} style={{ color: '#7EC691' } as CSSProperties} />
                                </div>
                                <h3 className="font-display font-medium text-base text-[#EDEDEA] mb-1.5">
                                    There are no notes here yet.
                                </h3>
                                <p className="text-xs text-[#8A867E] leading-relaxed mb-6">
                                    Select text anywhere on the web or create a manual snippet to get started.
                                </p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                                    style={{ background: '#5E9E6E' }}
                                >
                                    + New Manual Note
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                                {filteredNotes.map(note => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        onToggleFavorite={toggleFavorite}
                                        onDeleteNote={deleteNote}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>


            {/* Password Reset Success Window */}
            {showPasswordResetSuccess && (
                <div
                    role="status"
                    aria-live="polite"
                    data-testid="password-reset-success-modal"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeSlideUp"
                    onClick={() => setShowPasswordResetSuccess(false)}
                >
                    <div
                        className="relative max-w-sm w-full rounded-2xl sm:rounded-3xl p-6 border shadow-2xl text-center space-y-4"
                        style={{
                            background: "#181B19",
                            borderColor: "#2C322E",
                            color: "#EDEDEA",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                            style={{ background: "#1D3323", border: "1px solid #2C4233" }}
                            data-testid="shield-icon-container"
                        >
                            <ShieldCheck className="w-7 h-7" style={{ color: "#7EC691" }} />
                        </div>
                        <div className="space-y-1.5">
                            <h3
                                className="text-lg font-medium"
                                style={{ fontFamily: "var(--font-display)", color: "#EDEDEA" }}
                            >
                                Password Saved Successfully
                            </h3>
                            <p className="text-xs text-[#9E9B93] leading-relaxed">
                                Your new password has been updated and securely saved.
                            </p>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={() => setShowPasswordResetSuccess(false)}
                                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-white transition-colors cursor-pointer"
                                style={{ background: "#5E9E6E" }}
                            >
                                Continue to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AddNoteModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddNote={addNote}
                showNotification={showNotification}
            />
        </>
    );
}
