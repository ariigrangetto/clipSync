export const TAG_PALETTES: Record<string, { bg: string; text: string }> = {
    startups: { bg: '#1A3323', text: '#7EC691' },
    ideas: { bg: '#2B1E38', text: '#C49BF0' },
    health: { bg: '#332717', text: '#F6C368' },
    neuroscience: { bg: '#1A3323', text: '#7EC691' },
    css: { bg: '#1A293D', text: '#7DB3F7' },
    'web dev': { bg: '#1A293D', text: '#7DB3F7' },
    philosophy: { bg: '#38221B', text: '#F6957B' },
    habits: { bg: '#1A3323', text: '#7EC691' },
    design: { bg: '#2B1E38', text: '#C49BF0' },
    ux: { bg: '#2B1E38', text: '#C49BF0' },
    react: { bg: '#1A293D', text: '#7DB3F7' },
    performance: { bg: '#1A293D', text: '#7DB3F7' },
    finance: { bg: '#332717', text: '#F6C368' },
    investing: { bg: '#332717', text: '#F6C368' },
    leadership: { bg: '#1A3323', text: '#7EC691' },
    teams: { bg: '#1A3323', text: '#7EC691' },
    figma: { bg: '#2B1E38', text: '#C49BF0' },
    'design systems': { bg: '#2B1E38', text: '#C49BF0' },
};

const EXTRA_PALETTES = [
    { bg: '#1A3323', text: '#7EC691' }, // Verde
    { bg: '#2B1E38', text: '#C49BF0' }, // Púrpura
    { bg: '#332717', text: '#F6C368' }, // Ámbar
    { bg: '#1A293D', text: '#7DB3F7' }, // Azul
    { bg: '#38221B', text: '#F6957B' }, // Terracota
    { bg: '#381C28', text: '#F48BAF' }, // Rosa
];

export const defaultTag = EXTRA_PALETTES[0];

export function getTagPalette(tag: string): { bg: string; text: string } {
    if (!tag) return defaultTag;
    const key = tag.toLowerCase().trim();
    if (TAG_PALETTES[key]) return TAG_PALETTES[key];

    let sum = 0;
    for (let i = 0; i < key.length; i++) {
        sum += key.charCodeAt(i);
    }
    return EXTRA_PALETTES[sum % EXTRA_PALETTES.length];
}
