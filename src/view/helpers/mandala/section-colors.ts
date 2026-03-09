import { MandalaSectionColorAssignments } from 'src/stores/settings/settings-type';
import {
    compareSectionIds,
    swapSectionSubtreeIds,
} from 'src/mandala-v2/section-utils';

export { compareSectionIds };

export const SECTION_COLOR_KEYS = [
    '1_white',
    '2_rose',
    '3_amber',
    '4_yellow',
    '5_green',
    '6_blue',
    '7_violet',
    '8_graphite',
] as const;

export type SectionColorKey = (typeof SECTION_COLOR_KEYS)[number];

export const SECTION_COLOR_PALETTE: Record<SectionColorKey, string> = {
    '1_white': '#FFFFFF',
    '2_rose': '#C4445C',
    '3_amber': '#E8B262',
    '4_yellow': '#E9D967',
    '5_green': '#76BE77',
    '6_blue': '#677FEF',
    '7_violet': '#823CCB',
    '8_graphite': '#323232',
};

export type SectionColorMap = Record<SectionColorKey, string[]>;

export const applyOpacityToHex = (color: string, opacity: number) => {
    if (!color.startsWith('#')) return color;
    const hex = color.slice(1);
    if (hex.length !== 6) return color;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const alpha = Math.min(1, Math.max(0, opacity));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const createEmptySectionColorMap = (): SectionColorMap => ({
    '1_white': [],
    '2_rose': [],
    '3_amber': [],
    '4_yellow': [],
    '5_green': [],
    '6_blue': [],
    '7_violet': [],
    '8_graphite': [],
});

const normalizeSectionIds = (sections: string[]) =>
    Array.from(new Set(sections)).sort(compareSectionIds);

const normalizeSectionIdsFromUnknown = (value: unknown) => {
    if (Array.isArray(value)) {
        const rawSections = value as unknown[];
        return normalizeSectionIds(
            rawSections
                .map((section) =>
                    typeof section === 'number' ? String(section) : section,
                )
                .filter(
                    (section): section is string => typeof section === 'string',
                ),
        );
    }
    if (typeof value === 'string') {
        return [value];
    }
    if (typeof value === 'number') {
        return [String(value)];
    }
    return [];
};
export const parseSectionColorsFromPersistedState = (
    value: unknown,
): SectionColorMap => {
    const map = createEmptySectionColorMap();
    if (!value || typeof value !== 'object') return map;
    const record = value as Record<string, unknown>;
    for (const key of SECTION_COLOR_KEYS) {
        map[key] = normalizeSectionIdsFromUnknown(record[key]);
    }
    return map;
};

export const parsePinnedSectionsFromPersistedState = (value: unknown) =>
    normalizeSectionIdsFromUnknown(value);

export const createSectionColorIndex = (map: SectionColorMap) => {
    const index: Record<string, SectionColorKey> = {};
    for (const key of SECTION_COLOR_KEYS) {
        for (const section of map[key]) {
            index[section] = key;
        }
    }
    return index;
};

export const serializeSectionColorMap = (map: SectionColorMap) => {
    const result: Partial<SectionColorMap> = {};
    for (const key of SECTION_COLOR_KEYS) {
        const sections = normalizeSectionIds(map[key]);
        if (sections.length > 0) {
            result[key] = sections;
        }
    }
    return result;
};

export const serializeSectionColorMapForSettings = (
    map: SectionColorMap,
): MandalaSectionColorAssignments => serializeSectionColorMap(map);

export const setSectionColor = (
    map: SectionColorMap,
    section: string,
    colorKey: SectionColorKey | null,
) => {
    const next = createEmptySectionColorMap();
    for (const key of SECTION_COLOR_KEYS) {
        next[key] = map[key].filter((item) => item !== section);
    }
    if (colorKey) {
        next[colorKey] = normalizeSectionIds([...next[colorKey], section]);
    }
    return next;
};

export const swapSectionColors = (
    map: SectionColorMap,
    sourceSection: string,
    targetSection: string,
) => {
    if (!sourceSection || !targetSection || sourceSection === targetSection) {
        return map;
    }

    const index = createSectionColorIndex(map);
    const sourceColor = index[sourceSection] ?? null;
    const targetColor = index[targetSection] ?? null;
    if (sourceColor === targetColor) return map;

    let next = setSectionColor(map, sourceSection, targetColor);
    next = setSectionColor(next, targetSection, sourceColor);
    return next;
};

export const swapSectionSubtreeColors = (
    map: SectionColorMap,
    sourceSection: string,
    targetSection: string,
) => {
    if (!sourceSection || !targetSection || sourceSection === targetSection) {
        return map;
    }

    const next = createEmptySectionColorMap();
    for (const key of SECTION_COLOR_KEYS) {
        next[key] = normalizeSectionIds(
            swapSectionSubtreeIds(map[key], sourceSection, targetSection),
        );
    }
    return next;
};
