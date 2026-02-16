import { parseYaml, stringifyYaml } from 'obsidian';
import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';
import { MandalaView } from 'src/view/view';

export const SECTION_COLORS_FRONTMATTER_KEY = 'mandala_section_colors';
const PINNED_SECTIONS_FRONTMATTER_KEY = 'mandala_pinned_sections';

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

export const compareSectionIds = (a: string, b: string) => {
    const aParts = a.split('.').map((part) => Number(part));
    const bParts = b.split('.').map((part) => Number(part));
    const maxLen = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < maxLen; i += 1) {
        const aVal = aParts[i];
        const bVal = bParts[i];
        if (aVal === undefined) return -1;
        if (bVal === undefined) return 1;
        if (aVal === bVal) continue;
        return aVal - bVal;
    }
    return 0;
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

const stripFrontmatter = (frontmatter: string) =>
    frontmatter
        .replace(/^---\n/, '')
        .replace(/\n---\n?$/, '')
        .trim();

const parseFrontmatterRecord = (frontmatter: string) => {
    if (!frontmatter.trim()) return {};
    const content = stripFrontmatter(frontmatter);
    if (!content) return {};
    try {
        const parsed: unknown = parseYaml(content);
        if (parsed && typeof parsed === 'object') {
            return parsed as Record<string, unknown>;
        }
    } catch {
        return {};
    }
    return {};
};

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

const buildFrontmatterWithSectionColors = (
    frontmatter: string,
    map: SectionColorMap,
) => {
    const serialized = serializeSectionColorMap(map);
    const record = parseFrontmatterRecord(frontmatter);
    if (Object.keys(serialized).length === 0) {
        delete record[SECTION_COLORS_FRONTMATTER_KEY];
    } else {
        record[SECTION_COLORS_FRONTMATTER_KEY] = serialized;
    }
    const yaml = stringifyYaml(record).trim();
    return yaml ? `---\n${yaml}\n---\n` : '';
};

const normalizeSectionColorMap = (value: unknown): SectionColorMap => {
    const map = createEmptySectionColorMap();
    if (!value || typeof value !== 'object') return map;
    const record = value as Record<string, unknown>;
    for (const key of SECTION_COLOR_KEYS) {
        map[key] = normalizeSectionIdsFromUnknown(record[key]);
    }
    return map;
};

export const parseSectionColorsFromFrontmatter = (
    frontmatter: string,
): SectionColorMap => {
    const record = parseFrontmatterRecord(frontmatter);
    if (Object.keys(record).length === 0) {
        return createEmptySectionColorMap();
    }
    return normalizeSectionColorMap(record[SECTION_COLORS_FRONTMATTER_KEY]);
};

const buildFrontmatterWithPinnedSections = (
    frontmatter: string,
    sections: string[],
) => {
    const normalized = normalizeSectionIds(sections);
    const record = parseFrontmatterRecord(frontmatter);
    if (normalized.length === 0) {
        delete record[PINNED_SECTIONS_FRONTMATTER_KEY];
    } else {
        record[PINNED_SECTIONS_FRONTMATTER_KEY] = normalized;
    }
    const yaml = stringifyYaml(record).trim();
    return yaml ? `---\n${yaml}\n---\n` : '';
};

export const parsePinnedSectionsFromFrontmatter = (frontmatter: string) => {
    const record = parseFrontmatterRecord(frontmatter);
    return normalizeSectionIdsFromUnknown(
        record[PINNED_SECTIONS_FRONTMATTER_KEY],
    );
};

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

export const swapSectionColorsInFrontmatter = (
    frontmatter: string,
    sourceSection: string,
    targetSection: string,
) => {
    const currentMap = parseSectionColorsFromFrontmatter(frontmatter);
    const nextMap = swapSectionColors(
        currentMap,
        sourceSection,
        targetSection,
    );
    const currentSerialized = serializeSectionColorMap(currentMap);
    const nextSerialized = serializeSectionColorMap(nextMap);
    const hasChanged =
        JSON.stringify(currentSerialized) !== JSON.stringify(nextSerialized);
    if (!hasChanged) return frontmatter;
    return buildFrontmatterWithSectionColors(frontmatter, nextMap);
};

export const writeSectionColorsToFrontmatter = async (
    view: MandalaView,
    map: SectionColorMap,
) => {
    if (!view.file) return;
    const currentMap = parseSectionColorsFromFrontmatter(
        view.documentStore.getValue().file.frontmatter,
    );
    const currentSerialized = serializeSectionColorMap(currentMap);
    const nextSerialized = serializeSectionColorMap(map);
    const hasChanged =
        JSON.stringify(currentSerialized) !== JSON.stringify(nextSerialized);
    if (!hasChanged) return;

    const nextFrontmatter = buildFrontmatterWithSectionColors(
        view.documentStore.getValue().file.frontmatter,
        map,
    );
    updateFrontmatter(view, nextFrontmatter);
    await view.plugin.app.fileManager.processFrontMatter(
        view.file,
        (frontmatter) => {
            const frontmatterRecord = frontmatter as Record<string, unknown>;
            if (Object.keys(nextSerialized).length === 0) {
                delete frontmatterRecord[SECTION_COLORS_FRONTMATTER_KEY];
            } else {
                frontmatterRecord[SECTION_COLORS_FRONTMATTER_KEY] =
                    nextSerialized;
            }
        },
    );
};

export const writePinnedSectionsToFrontmatter = async (
    view: MandalaView,
    sections: string[],
) => {
    if (!view.file) return;
    const currentFrontmatter = view.documentStore.getValue().file.frontmatter;
    const currentSections = parsePinnedSectionsFromFrontmatter(currentFrontmatter);
    const nextSections = normalizeSectionIds(sections);
    const hasChanged =
        JSON.stringify(currentSections) !== JSON.stringify(nextSections);
    if (!hasChanged) return;

    const nextFrontmatter = buildFrontmatterWithPinnedSections(
        currentFrontmatter,
        nextSections,
    );
    updateFrontmatter(view, nextFrontmatter);
    await view.plugin.app.fileManager.processFrontMatter(
        view.file,
        (frontmatter) => {
            const frontmatterRecord = frontmatter as Record<string, unknown>;
            if (nextSections.length === 0) {
                delete frontmatterRecord[PINNED_SECTIONS_FRONTMATTER_KEY];
            } else {
                frontmatterRecord[PINNED_SECTIONS_FRONTMATTER_KEY] =
                    nextSections;
            }
        },
    );
};
