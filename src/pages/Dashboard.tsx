import { useState, useEffect, type CSSProperties } from "react";
import useNotification from "../hooks/useNotification.tsx";
import { FlowerIcon, PlusIcon, SearchIcon, GridIcon, HeartIcon, KeyIcon } from "../components/Icons.tsx";
import NoteCard from "../components/NoteCard.tsx";
import AddNoteModal from "../components/AddNoteModal.tsx";
import { useUserToken } from "../hooks/useUserToken.ts";
import useNotes from "../hooks/useNotes.tsx";
import { useNavigate } from "react-router-dom";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
declare const chrome: any;

export default function Dashboard() {
    const { notes, loading: notesLoading, addNote, deleteNote, toggleFavorite, updateNote, cat } = useNotes();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [activeNav, setActiveNav] = useState(0);
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [searchFocused, setSearchFocused] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const { user, signOut, loading: userLoading } = useUserToken();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const isLoading = notesLoading || userLoading;

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
        } finally {
            navigate("/login");
        }
    };


    // Estado de guardado automático (activado/desactivado)
    const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem("clipsync_autosave_enabled");
        return saved === null ? true : saved === "true";
    });

    const favoriteCount = notes.reduce((acc, note) => acc + (note.favorite ? 1 : 0), 0);

    const NAV_ITEMS = [
        { icon: GridIcon, label: 'All Notes', count: notes.length },
        { icon: HeartIcon, label: 'Favorites', count: favoriteCount },
    ];

    const filteredNotes = notes.filter((note) => {
        const matchesCategory = activeCategory === "All" || note.category === activeCategory.toLowerCase();
        const matchFavorites = activeNav !== 1 || note.favorite;
        const matchSearch = !searchQuery ||
            note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesCategory && matchFavorites && matchSearch;
    });

    const toggleAutoSaveEnabled = () => {
        const newValue = !autoSaveEnabled;
        setAutoSaveEnabled(newValue);
        localStorage.setItem("clipsync_autosave_enabled", String(newValue));
        if (typeof chrome !== "undefined" && chrome?.storage?.local) {
            chrome.storage.local.set({ clipsync_autosave_enabled: newValue });
        }
        showNotification(
            newValue ? "AutoSave is enabled" : "AutoSave is disabled",
            false
        );
    };

    useEffect(() => {
        if (!autoSaveEnabled) return;

        async function handlePointerUp(e: MouseEvent) {
            const selection = window.getSelection();
            console.log(selection);
            const selectedText = selection ? selection.toString().trim() : "";
            const currentSource = selection ? window.getSelection()?.anchorNode?.baseURI : window.location.href;

            const target = e.target as HTMLElement;
            if (
                target?.tagName === "INPUT" ||
                target?.tagName === "TEXTAREA" ||
                target?.isContentEditable ||
                target?.closest("button")
            ) {
                return;
            }

            if (selectedText.length < 3) {
                return;
            }

            //check if theres already a note with the same url

            const existingNoteWithSource = notes.find((n) => n.source === currentSource);
            console.log(existingNoteWithSource);

            const targetNoteId = existingNoteWithSource ? existingNoteWithSource.id : null;

            let textToSave = selectedText;

            //if theres an existing note with the same url and with previous text, we append the new text
            if (existingNoteWithSource && existingNoteWithSource.text && targetNoteId) {
                textToSave = `${existingNoteWithSource.text}\n\n${selectedText}`;
                const response = await updateNote(textToSave, targetNoteId);
                if (response.error) {
                    showNotification("Failed to save the note. Please try again", true);
                } else {
                    showNotification("Text appended to existing note", false);
                }
                return;
            }
            else {
                const response = await addNote({ text: textToSave, source: currentSource });
                if (response.error) {
                    showNotification("Failed to create new note", true);
                } else {
                    showNotification("New Note created", false);
                };
            }
        }

        window.addEventListener("mouseup", handlePointerUp);
        return () => window.removeEventListener("mouseup", handlePointerUp);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSaveEnabled, addNote, updateNote, notes]);

    return (
        <>
            <div
                className="flex h-screen overflow-hidden"
                style={{ background: '#121413', fontFamily: 'var(--font-body)' }}
            >
                <aside
                    className="w-56 flex flex-col shrink-0 border-r"
                    style={{
                        background: '#181B19',
                        borderColor: '#2C322E',
                    }}
                >
                    <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: '#5E9E6E' }}
                        >
                            <FlowerIcon size={18} className="logo-flower" style={{ color: '#ffffff' } as CSSProperties} />
                        </div>
                        <span
                            className="text-base font-semibold tracking-tight"
                            style={{ fontFamily: 'var(--font-display)', color: '#EDEDEA', fontWeight: 500 }}
                        >
                            ClipSync
                        </span>
                    </div>

                    <nav className="flex-1 px-3 space-y-0.5">
                        {NAV_ITEMS.map((item, i) => {
                            const Icon = item.icon;
                            const isActive = activeNav === i;
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => setActiveNav(i)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer"
                                    style={{
                                        background: isActive ? '#1D3323' : 'transparent',
                                        color: isActive ? '#7EC691' : '#9E9B93',
                                        fontSize: '0.825rem',
                                        fontWeight: isActive ? 500 : 400,
                                    }}
                                >
                                    <Icon size={15} />
                                    <span className="flex-1">{item.label}</span>
                                    {item.count !== null && (
                                        <span
                                            className="text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center"
                                            style={{
                                                background: isActive ? '#284631' : '#232825',
                                                color: isActive ? '#A3E3B5' : '#88847C',
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
                    <div
                        className="mx-3 mb-3 p-3 rounded-2xl transition-all duration-200"
                        style={{
                            background: autoSaveEnabled ? '#1A291E' : '#1F2421',
                            border: autoSaveEnabled ? '1px solid #2F5238' : '1px solid #2C322E',
                        }}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0"
                                    style={{
                                        background: autoSaveEnabled ? '#5E9E6E' : '#3A403C',
                                        color: '#FFFFFF',
                                    }}
                                >
                                    <FlowerIcon size={14} />
                                </div>
                                <div className="truncate">
                                    <p className="text-xs font-medium leading-tight truncate" style={{ color: '#EDEDEA', fontSize: '0.75rem' }}>
                                        Auto-save
                                    </p>
                                    <p className="text-xs font-medium mt-0.5 truncate" style={{ color: autoSaveEnabled ? '#7EC691' : '#7D7A73', fontSize: '0.66rem' }}>
                                        {autoSaveEnabled ? 'Enabled' : 'Disabled'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={toggleAutoSaveEnabled}
                                title={autoSaveEnabled ? 'Disable auto-save' : 'Enable auto-save'}
                                className="w-9 h-5 rounded-full p-0.5 transition-all duration-200 ease-in-out cursor-pointer relative shrink-0"
                                style={{
                                    background: autoSaveEnabled ? '#5E9E6E' : '#3A403C',
                                }}
                            >
                                <span
                                    className="block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out"
                                    style={{
                                        transform: autoSaveEnabled ? 'translateX(16px)' : 'translateX(0px)',
                                    }}
                                />
                            </button>
                        </div>
                    </div>

                    <div
                        className="mx-3 mb-3 p-3 rounded-xl"
                        style={{ background: '#1A291E', border: '1px dashed #2F5238' }}
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <FlowerIcon size={13} style={{ color: '#7EC691' } as CSSProperties} />
                            <span className="text-xs font-medium" style={{ color: '#7EC691', fontSize: '0.72rem' }}>
                                Capture Module
                            </span>
                        </div>
                        <p style={{ color: '#8BA693', fontSize: '0.68rem', lineHeight: 1.5 }}>
                            {autoSaveEnabled ? 'Everything you select will be saved automatically.' : 'Save disabled: select text freely.'}
                        </p>
                    </div>

                    <div
                        className="mx-3 mb-5 p-3 rounded-xl transition-all duration-200"
                        style={{ background: '#1F2421', border: '1px solid #2C322E' }}
                    >
                        <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <KeyIcon size={13} style={{ color: '#5E9E6E' } as CSSProperties} className="shrink-0" />
                                <div className="truncate">
                                    <span className="text-xs font-medium block truncate" style={{ color: '#EDEDEA', fontSize: '0.72rem' }}>
                                        Authenticated User
                                    </span>
                                    {user?.email && (
                                        <span className="text-[0.65rem] text-petal-muted block truncate" title={user.email}>
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
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer hover:opacity-80 disabled:opacity-50"
                                style={{ background: '#3A1E1E', color: '#F87171', fontSize: '0.66rem' }}
                            >
                                {isLoggingOut ? (
                                    <span className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 border border-[#F87171] border-t-transparent rounded-full animate-spin" />
                                        <span>Logging out...</span>
                                    </span>
                                ) : (
                                    <span>Logout</span>
                                )}
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header
                        className="flex items-center justify-between px-7 py-4 border-b shrink-0"
                        style={{ borderColor: '#2C322E', background: 'rgba(18,20,19,0.85)', backdropFilter: 'blur(8px)' }}
                    >
                        <div>
                            <h1
                                className="text-xl leading-tight"
                                style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: '#EDEDEA' }}
                            >
                                {activeNav === 1 ? 'Favorites' : 'My Clippings'}
                            </h1>
                            <p style={{ color: '#9E9B93', fontSize: '0.78rem', marginTop: 2 }}>
                                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200"
                                style={{
                                    background: searchFocused ? '#1E2220' : '#181B19',
                                    borderColor: searchFocused ? '#5E9E6E' : '#2C322E',
                                    width: searchFocused ? 240 : 180,
                                }}
                            >
                                <SearchIcon size={15} style={{ color: '#9E9B93' } as CSSProperties} />
                                <input
                                    type="text"
                                    placeholder="Search notes, tags..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                    className="bg-transparent text-xs w-full outline-none placeholder-[#6E6B65]"
                                    style={{ color: '#EDEDEA' }}
                                />
                            </div>

                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white shadow-sm transition-all duration-150 hover:opacity-90 active:scale-95 cursor-pointer"
                                style={{ background: '#5E9E6E' }}
                            >
                                <PlusIcon size={14} />
                                <span>New Note</span>
                            </button>
                        </div>
                    </header>

                    <div className="px-7 py-3 border-b flex items-center justify-between gap-4" style={{ borderColor: '#2C322E', background: '#181B19' }}>
                        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                            {cat.map(c => {
                                const isCatActive = activeCategory === c;
                                return (
                                    <button
                                        key={c}
                                        onClick={() => setActiveCategory(c)}
                                        className="px-3.5 py-1.5 rounded-xl text-xs transition-all duration-150 capitalize whitespace-nowrap hover:bg-[#232825] hover:text-[#EDEDEA] cursor-pointer"
                                        style={{
                                            background: isCatActive ? '#5E9E6E' : 'transparent',
                                            color: isCatActive ? '#FFFFFF' : '#9E9B93',
                                            fontWeight: isCatActive ? 500 : 400,
                                        }}
                                    >
                                        {c}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-7">
                        {isLoading ? (
                            <div>
                                <div className="flex items-center gap-2 text-xs font-medium mb-5" style={{ color: '#7EC691' }}>
                                    <div className="w-4 h-4 border-2 border-petal-green border-t-transparent rounded-full animate-spin" />
                                    <span>Loading your clippings...</span>
                                </div>
                                <div
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                    }}
                                >
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div
                                            key={i}
                                            className="p-5 rounded-2xl animate-pulse flex flex-col justify-between h-44"
                                            style={{ background: '#1E2220', border: '1px solid #2C322E' }}
                                        >
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="h-3 bg-[#2C322E] rounded-md w-20" />
                                                    <div className="h-3 bg-[#2C322E] rounded-full w-12" />
                                                </div>
                                                <div className="h-4 bg-[#2C322E] rounded-md w-3/4" />
                                                <div className="h-3 bg-[#5E9E6E] opacity-30 rounded-md w-full" />
                                                <div className="h-3 bg-[#5E9E6E] opacity-30 rounded-md w-2/3" />
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-[#2C322E]">
                                                <div className="h-3 bg-[#2C322E] rounded-md w-16" />
                                                <div className="h-3 bg-[#2C322E] rounded-md w-12" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : filteredNotes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center max-w-sm mx-auto">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                                    style={{ background: '#1D3323' }}
                                >
                                    <FlowerIcon size={24} style={{ color: '#7EC691' } as CSSProperties} />
                                </div>
                                <h3 className="font-display font-medium text-base text-petal-text mb-1">
                                    There are no notes here yet.
                                </h3>
                                <p className="text-xs text-[#9E9B93] mb-5">
                                    Select text anywhere on the web or create a note manually to get started.
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors cursor-pointer"
                                        style={{ background: '#5E9E6E' }}
                                    >
                                        + New Manual Note
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="grid gap-4"
                                style={{
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                }}
                            >
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

            <AddNoteModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddNote={addNote}
                showNotification={showNotification}
            />
        </>
    );
}
