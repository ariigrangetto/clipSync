import { useNavigate } from "react-router";
import type { Note } from "../types/note.ts";
import { getTagPalette } from "./TagsColor.tsx";
import { ExternalLinkIcon, FlowerIcon, HeartIcon } from "./Icons.tsx";

function formatRelativeTime(dateString?: string): string {
    if (!dateString) return "Not date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Not date";

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NoteCard({
    note,
    onToggleFavorite,
    onDeleteNote
}: {
    note: Note;
    onToggleFavorite: (id: string) => void;
    onDeleteNote?: (id: string) => void;
}) {
    const navigate = useNavigate();
    const isCode = note.category === 'code';
    const isQuote = note.category === 'quote';
    const sourceText = note.source || 'Manual Entry';
    const tags = Array.isArray(note.tags) ? note.tags : [];

    const handleCardClick = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            return;
        }
        navigate(`/note/${note.id}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className="note-card bg-petal-card rounded-2xl p-4 sm:p-5 border border-petal-border cursor-pointer group relative flex flex-col justify-between transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30"
            style={{
                background: 'linear-gradient(180deg, #1A1E1C 0%, #161817 100%)',
                borderColor: '#29302B',
            }}
        >
            {/* Top Bar: Source + Category + Actions */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-xs"
                        style={{ background: '#223828', color: '#7EC691' }}
                    >
                        <FlowerIcon size={11} />
                    </div>
                    <span
                        className="text-xs text-petal-muted truncate max-w-[130px] sm:max-w-[160px] font-medium"
                        style={{ fontFamily: 'var(--font-body)', color: '#A5A198' }}
                        title={sourceText}
                    >
                        {sourceText}
                    </span>
                    {note.category && (
                        <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase shrink-0 ring-1 ring-inset"
                            style={{
                                background: '#252014',
                                color: '#F6C368',
                                borderColor: 'rgba(246, 195, 104, 0.2)',
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            {note.category}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(note.id);
                        }}
                        className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/5"
                        style={{
                            color: note.favorite ? '#5E9E6E' : '#6E6B65',
                        }}
                        onMouseEnter={e => {
                            if (!note.favorite) (e.currentTarget as HTMLButtonElement).style.color = '#5E9E6E'
                        }}
                        onMouseLeave={e => {
                            if (!note.favorite) (e.currentTarget as HTMLButtonElement).style.color = '#6E6B65'
                        }}
                        title={note.favorite ? "Remove from favorites" : "Add to favorites"}
                        aria-label={note.favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <HeartIcon size={14} filled={note.favorite} />
                    </button>
                    {onDeleteNote && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.id);
                            }}
                            className="p-1.5 rounded-lg text-[#6E6B65] hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                            title="Delete note"
                            aria-label="Delete note"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="mb-4 flex-1">
                {note.title ? (
                    <h3
                        className="font-display font-medium text-[0.95rem] mb-2 leading-snug line-clamp-2 break-words tracking-tight group-hover:text-emerald-300/90 transition-colors"
                        style={{
                            color: '#EDEDEA',
                        }}
                    >
                        {note.title}
                    </h3>
                ) : (
                    <span
                        className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-md font-medium border border-dashed border-[#343B36] hover:border-petal-green hover:bg-petal-green-light hover:text-petal-green transition-all mb-2 cursor-pointer"
                        style={{
                            background: '#151816',
                            color: '#8A867E',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.7rem',
                        }}
                    >
                        + Add title
                    </span>
                )}

                {isQuote ? (
                    <div className="pl-2.5 border-l-2 border-[#5E9E6E]/60 my-1">
                        <p
                            className="text-xs leading-relaxed line-clamp-4 break-words italic"
                            style={{
                                fontFamily: 'var(--font-display)',
                                color: '#D4D0C7',
                                fontSize: '0.85rem',
                                lineHeight: '1.6',
                            }}
                        >
                            "{note.text}"
                        </p>
                    </div>
                ) : isCode ? (
                    <div
                        className="rounded-xl p-2.5 my-1 border border-[#233527]/80 overflow-hidden"
                        style={{
                            background: '#111E16',
                        }}
                    >
                        <p
                            className="text-xs leading-relaxed line-clamp-4 break-words font-mono"
                            style={{
                                color: '#88D99E',
                                fontSize: '0.74rem',
                                lineHeight: '1.65',
                            }}
                        >
                            {note.text}
                        </p>
                    </div>
                ) : (
                    <p
                        className="text-xs leading-relaxed line-clamp-4 break-words"
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: '#B8B4AA',
                            fontSize: '0.82rem',
                            lineHeight: '1.6',
                        }}
                    >
                        {note.text}
                    </p>
                )}
            </div>

            {/* Tags Strip */}
            {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {tags.map(tag => {
                        const palette = getTagPalette(tag);
                        return (
                            <span
                                key={tag}
                                className="text-xs px-2 py-0.5 rounded-md font-medium ring-1 ring-inset ring-white/5"
                                style={{
                                    background: palette.bg,
                                    color: palette.text,
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.7rem',
                                }}
                            >
                                {tag}
                            </span>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    <span
                        className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium border border-dashed border-[#3A403C] hover:border-petal-green hover:bg-petal-green-light hover:text-petal-green transition-all cursor-pointer"
                        style={{
                            background: '#1A1E1C',
                            color: '#9E9B93',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.7rem',
                        }}
                    >
                        + Add tags
                    </span>
                </div>
            )}

            {/* Bottom Footer: Date + Open Action */}
            <div
                className="flex items-center justify-between pt-2.5 mt-auto border-t"
                style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
            >
                <span className="text-xs font-medium" style={{ color: '#7D7A73', fontFamily: 'var(--font-body)' }}>
                    {formatRelativeTime(note.created_at)}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/note/${note.id}`);
                    }}
                    className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 font-medium transition-all duration-150 group-hover:bg-[#203626] group-hover:text-[#88D99E] cursor-pointer"
                    style={{
                        color: '#7EC691',
                        background: '#18271C',
                        fontSize: '0.72rem',
                    }}
                >
                    <ExternalLinkIcon size={11} />
                    Open
                </button>
            </div>
        </div>
    );
}
