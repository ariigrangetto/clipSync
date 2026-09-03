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
        navigate(`/note/${note.id}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className="note-card bg-petal-card rounded-2xl p-5 border border-petal-border cursor-pointer group relative"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white"
                        style={{ backgroundColor: '#5E9E6E' }}
                    >
                        <FlowerIcon size={12} />
                    </div>
                    <span className="text-xs text-petal-muted truncate" style={{ fontFamily: 'var(--font-body)' }}>
                        {sourceText}
                    </span>
                    {note.category && (
                        <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize shrink-0"
                            style={{ background: '#332717', color: '#F6C368', fontFamily: 'var(--font-body)' }}
                        >
                            {note.category}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(note.id);
                        }}
                        className="p-1 rounded-lg transition-all duration-150 cursor-pointer"
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
                    >
                        <HeartIcon size={14} filled={note.favorite} />
                    </button>
                    {onDeleteNote && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.id);
                            }}
                            className="p-1 rounded-lg text-[#6E6B65] hover:text-red-400 hover:bg-red-950/40 transition-all duration-150 cursor-pointer"
                            title="Delete note"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            <div className="mb-4">
                {note.title ? (
                    <h3
                        className="font-display font-semibold text-base text-petal-text mb-1.5 leading-snug line-clamp-2"
                        style={{
                            fontFamily: 'var(--font-display)',
                            color: '#EDEDEA',
                        }}
                    >
                        {note.title}
                    </h3>
                ) : (
                    <span
                        className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium border border-dashed border-[#3A403C] hover:border-petal-green hover:bg-petal-green-light hover:text-petal-green transition-all mb-2 cursor-pointer"
                        style={{
                            background: '#1A1E1C',
                            color: '#9E9B93',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.7rem',
                        }}
                    >
                        + Add title
                    </span>
                )}
                {isQuote ? (
                    <p
                        className="text-sm leading-relaxed line-clamp-4"
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontStyle: 'italic',
                            color: '#EDEDEA',
                            fontSize: '0.9rem',
                            lineHeight: '1.65',
                        }}
                    >
                        "{note.text}"
                    </p>
                ) : isCode ? (
                    <p
                        className="text-xs leading-relaxed rounded-lg px-3 py-2 line-clamp-4"
                        style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
                            color: '#7EC691',
                            background: '#14261B',
                            fontSize: '0.78rem',
                            lineHeight: '1.7',
                        }}
                    >
                        {note.text}
                    </p>
                ) : (
                    <p
                        className="text-sm leading-relaxed line-clamp-4"
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: '#D4D0C7',
                            fontSize: '0.875rem',
                            lineHeight: '1.65',
                        }}
                    >
                        {note.text}
                    </p>
                )}
            </div>

            {
                tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {tags.map(tag => {
                            const palette = getTagPalette(tag);
                            return (
                                <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
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
                )
            }

            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #2C322E' }}>
                <span className="text-xs" style={{ color: '#7D7A73', fontFamily: 'var(--font-body)' }}>
                    {formatRelativeTime(note.created_at)}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/note/${note.id}`);
                    }}
                    className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-all duration-150 opacity-0 group-hover:opacity-100 cursor-pointer"
                    style={{
                        color: '#7EC691',
                        background: '#1D3323',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.72rem',
                    }}
                >
                    <ExternalLinkIcon size={11} />
                    Open
                </button>
            </div>
        </div >
    );
}


