export const TAG_PALETTES: Record<string, { bg: string; text: string }> = {
    startups: { bg: '#EBF2ED', text: '#3D6647' },
    ideas: { bg: '#EEE8F2', text: '#6B4E8A' },
    health: { bg: '#F2EDE4', text: '#8A6B3D' },
    neuroscience: { bg: '#EBF2ED', text: '#3D6647' },
    css: { bg: '#E8EBF2', text: '#3D4E8A' },
    'web dev': { bg: '#E8EBF2', text: '#3D4E8A' },
    philosophy: { bg: '#F2EAE4', text: '#8A4E3D' },
    habits: { bg: '#EBF2ED', text: '#3D6647' },
    design: { bg: '#EEE8F2', text: '#6B4E8A' },
    ux: { bg: '#EEE8F2', text: '#6B4E8A' },
    react: { bg: '#E8EBF2', text: '#3D4E8A' },
    performance: { bg: '#E8EBF2', text: '#3D4E8A' },
    finance: { bg: '#F2EDE4', text: '#8A6B3D' },
    investing: { bg: '#F2EDE4', text: '#8A6B3D' },
    leadership: { bg: '#EBF2ED', text: '#3D6647' },
    teams: { bg: '#EBF2ED', text: '#3D6647' },
    figma: { bg: '#EEE8F2', text: '#6B4E8A' },
    'design systems': { bg: '#EEE8F2', text: '#6B4E8A' },
};

const EXTRA_PALETTES = [
    { bg: '#EBF2ED', text: '#3D6647' }, // Verde
    { bg: '#EEE8F2', text: '#6B4E8A' }, // Púrpura
    { bg: '#F2EDE4', text: '#8A6B3D' }, // Ámbar
    { bg: '#E8EBF2', text: '#3D4E8A' }, // Azul
    { bg: '#F2EAE4', text: '#8A4E3D' }, // Terracota
    { bg: '#FCEEF2', text: '#8C3A5C' }, // Rosa pastel
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
