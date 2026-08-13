import { useState, useEffect, useRef, type CSSProperties } from "react";
import useNotification from "../hooks/useNotification.tsx";
import { FlowerIcon, PlusIcon, SearchIcon, GridIcon, HeartIcon, GlobeIcon, KeyIcon, CopyIcon, CheckIcon } from "../components/Icons.tsx";
import NoteCard from "../components/NoteCard.tsx";
import AddNoteModal from "../components/AddNoteModal.tsx";
import { useUserToken } from "../hooks/useUserToken.ts";
import useNotes from "../hooks/useNotes.tsx";

declare const chrome: any;

export default function Dashboard() {
    const { notes, loading, addNote, deleteNote, toggleFavorite, updateNote, cat } = useNotes();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [activeNav, setActiveNav] = useState(0);
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [searchFocused, setSearchFocused] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { showNotification } = useNotification();
    const { token, getSyncLink } = useUserToken();
    const [copiedToken, setCopiedToken] = useState(false);

    const handleCopyToken = () => {
        if (!token) return;
        navigator.clipboard.writeText(token);
        setCopiedToken(true);
        showNotification("Token copiado al portapapeles", false);
        setTimeout(() => setCopiedToken(false), 2000);
    };


    // Estado de guardado automático (activado/desactivado)
    const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem("clipsync_autosave_enabled");
        return saved === null ? true : saved === "true";
    });

    // Refs para mantener el estado de auto-guardado sin que se reinicie al re-renderizar
    const lastSourceRef = useRef<string>("");
    const lastNoteIdRef = useRef<string | undefined>(undefined);

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

    // Alternar activar/desactivar guardado automático
    const toggleAutoSaveEnabled = () => {
        const newValue = !autoSaveEnabled;
        setAutoSaveEnabled(newValue);
        localStorage.setItem("clipsync_autosave_enabled", String(newValue));
        if (typeof chrome !== "undefined" && chrome?.storage?.local) {
            chrome.storage.local.set({ clipsync_autosave_enabled: newValue });
        }
        showNotification(
            newValue ? "Guardado automático activado" : "Guardado automático desactivado",
            false
        );
    };

    useEffect(() => {
        if (!autoSaveEnabled) return;

        async function handlePointerUp(e: MouseEvent) {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";
            const source = window.location.href;

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

            const existingNote = notes.find((n) => (lastNoteIdRef.current ? n.id === lastNoteIdRef.current : n.source === source));
            const targetNoteId = lastNoteIdRef.current || existingNote?.id;

            if (lastSourceRef.current === source || targetNoteId) {
                lastSourceRef.current = source;

                let textToSave = selectedText;
                if (existingNote && existingNote.text) {
                    textToSave = `${existingNote.text}\n\n${selectedText}`;

                }

                const response = await updateNote(textToSave, source, targetNoteId);
                if (response?.data?.id) {
                    lastNoteIdRef.current = response.data.id;
                };

            } else {
                lastSourceRef.current = source;
                const response = await addNote({ text: selectedText, source });
                if (response?.data?.id) {
                    lastNoteIdRef.current = response.data.id;
                }
            }
        }

        window.addEventListener("mouseup", handlePointerUp);
        return () => window.removeEventListener("mouseup", handlePointerUp);
    }, [autoSaveEnabled, addNote, updateNote, notes]);

    const handleCopySyncLink = () => {
        const syncUrl = getSyncLink();
        navigator.clipboard.writeText(syncUrl);
        showNotification("Enlace de sincronización copiado", false);
    };

    return (
        <>
            <div
                className="flex h-screen overflow-hidden"
                style={{ background: '#F0EDE4', fontFamily: 'var(--font-body)' }}
            >
                <aside
                    className="w-56 flex flex-col shrink-0 border-r"
                    style={{
                        background: '#FAFAF7',
                        borderColor: '#E5DED0',
                    }}
                >
                    <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: '#4A7856' }}
                        >
                            <FlowerIcon size={18} className="logo-flower" style={{ color: '#ffffff' } as CSSProperties} />
                        </div>
                        <span
                            className="text-base font-semibold tracking-tight"
                            style={{ fontFamily: 'var(--font-display)', color: '#1C1914', fontWeight: 500 }}
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
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150"
                                    style={{
                                        background: isActive ? '#EBF2ED' : 'transparent',
                                        color: isActive ? '#4A7856' : '#6B6560',
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
                                                background: isActive ? '#C4D9CA' : '#EDE8E0',
                                                color: isActive ? '#3D6647' : '#9B9590',
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
                            background: autoSaveEnabled ? '#EBF2ED' : '#F2EFEE',
                            border: autoSaveEnabled ? '1px solid #C4D9CA' : '1px solid #E5DED0',
                        }}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0"
                                    style={{
                                        background: autoSaveEnabled ? '#4A7856' : '#9B9590',
                                        color: '#FFFFFF',
                                    }}
                                >
                                    <FlowerIcon size={14} />
                                </div>
                                <div className="truncate">
                                    <p className="text-xs font-medium leading-tight truncate" style={{ color: '#1C1914', fontSize: '0.75rem' }}>
                                        Auto-save
                                    </p>
                                    <p className="text-xs font-medium mt-0.5 truncate" style={{ color: autoSaveEnabled ? '#3D6647' : '#9B9590', fontSize: '0.66rem' }}>
                                        {autoSaveEnabled ? 'Enabled' : 'Disabled'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={toggleAutoSaveEnabled}
                                title={autoSaveEnabled ? 'Desactivar guardado automático' : 'Activar guardado automático'}
                                className="w-9 h-5 rounded-full p-0.5 transition-all duration-200 ease-in-out cursor-pointer relative shrink-0"
                                style={{
                                    background: autoSaveEnabled ? '#4A7856' : '#C7C2BC',
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
                        style={{ background: '#EBF2ED', border: '1px dashed #C4D9CA' }}
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <FlowerIcon size={13} style={{ color: '#4A7856' } as CSSProperties} />
                            <span className="text-xs font-medium" style={{ color: '#4A7856', fontSize: '0.72rem' }}>
                                Capture Module
                            </span>
                        </div>
                        <p style={{ color: '#7A9682', fontSize: '0.68rem', lineHeight: 1.5 }}>
                            {autoSaveEnabled ? 'Everything you select will be saved automatically.' : 'Save disabled: select text freely.'}
                        </p>
                    </div>

                    <div
                        className="mx-3 mb-5 p-3 rounded-xl transition-all duration-200"
                        style={{ background: '#FAF8F5', border: '1px solid #E5DED0' }}
                    >
                        <div className="flex items-center justify-between gap-1 mb-2">
                            <div className="flex items-center gap-1.5">
                                <KeyIcon size={13} style={{ color: '#4A7856' } as CSSProperties} />
                                <span className="text-xs font-medium" style={{ color: '#1C1914', fontSize: '0.72rem' }}>
                                    Your User Token
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyToken}
                                title="Copiar Token"
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer hover:opacity-80"
                                style={{ background: '#EBF2ED', color: '#4A7856', fontSize: '0.66rem' }}
                            >
                                {copiedToken ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
                                <span>{copiedToken ? 'Copied!' : 'Copy'}</span>
                            </button>
                        </div>
                        <div
                            className="p-2 rounded-lg mb-2 font-mono select-all flex items-center justify-between overflow-hidden"
                            style={{ background: '#F0EDE4', color: '#33302C', fontSize: '0.7rem', letterSpacing: '0.02em', border: '1px solid #E5DED0' }}
                        >
                            <span className="truncate">{token || 'clip_...'}</span>
                        </div>
                        <p style={{ color: '#8C857B', fontSize: '0.66rem', lineHeight: 1.4 }}>
                            Save this token to log in from another device or to sign in again without losing anything.
                        </p>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header
                        className="flex items-center justify-between px-7 py-4 border-b shrink-0"
                        style={{ borderColor: '#E5DED0', background: 'rgba(240,237,228,0.8)', backdropFilter: 'blur(8px)' }}
                    >
                        <div>
                            <h1
                                className="text-xl leading-tight"
                                style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: '#1C1914' }}
                            >
                                {activeNav === 1 ? 'Favorites' : 'My Clippings'}
                            </h1>
                            <p style={{ color: '#A09A91', fontSize: '0.78rem', marginTop: 2 }}>
                                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200"
                                style={{
                                    background: searchFocused ? '#FFFFFF' : '#F5F1E9',
                                    borderColor: searchFocused ? '#C4D9CA' : '#E5DED0',
                                    width: searchFocused ? 240 : 180,
                                }}
                            >
                                <SearchIcon size={15} style={{ color: '#A09A91' } as CSSProperties} />
                                <input
                                    type="text"
                                    placeholder="Search notes, tags..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                    className="bg-transparent text-xs w-full outline-none placeholder-[#A09A91]"
                                    style={{ color: '#1C1914' }}
                                />
                            </div>

                            <button
                                onClick={handleCopySyncLink}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-petal-border text-[#6B6560] hover:bg-[#EDE8E0] transition-colors"
                                title="Copy link to open your session in another browser or device"
                            >
                                <GlobeIcon size={14} />
                                <span>Sync</span>
                            </button>

                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white shadow-sm transition-all duration-150 hover:opacity-90 active:scale-95"
                                style={{ background: '#4A7856' }}
                            >
                                <PlusIcon size={14} />
                                <span>New Note</span>
                            </button>
                        </div>
                    </header>

                    <div className="px-7 py-3 border-b flex items-center justify-between gap-4" style={{ borderColor: '#E5DED0', background: '#FAF8F5' }}>
                        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                            {cat.map(c => {
                                const isCatActive = activeCategory === c;
                                return (
                                    <button
                                        key={c}
                                        onClick={() => setActiveCategory(c)}
                                        className="px-3.5 py-1.5 rounded-xl text-xs transition-all duration-150 capitalize whitespace-nowrap hover:bg-[#EDE8E0] hover:text-petal-text cursor-pointer"
                                        style={{
                                            background: isCatActive ? '#4A7856' : 'transparent',
                                            color: isCatActive ? '#FFFFFF' : '#7A746E',
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
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-3 text-sm text-[#A09A91]">
                                <div className="w-6 h-6 border-2 border-petal-border border-t-transparent rounded-full animate-spin" />
                                <span>Loading your clippings...</span>
                            </div>
                        ) : filteredNotes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center max-w-sm mx-auto">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                                    style={{ background: '#EBF2ED' }}
                                >
                                    <FlowerIcon size={24} style={{ color: '#4A7856' } as CSSProperties} />
                                </div>
                                <h3 className="font-display font-medium text-base text-petal-text mb-1">
                                    There are no notes here yet.
                                </h3>
                                <p className="text-xs text-[#A09A91] mb-5">
                                    Select text anywhere on the web or create a note manually to get started.
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors"
                                        style={{ background: '#4A7856' }}
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
