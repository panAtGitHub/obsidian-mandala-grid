import { parseYaml } from 'obsidian';
import { MandalaView } from 'src/view/view';

export const SECTION_COLORS_FRONTMATTER_KEY = 'mandala_section_colors';

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

const stripFrontmatter = (frontmatter: string) =>
    frontmatter
        .replace(/^---\n/, '')
        .replace(/\n---\n?$/, '')
        .trim();

const normalizeSectionColorMap = (value: unknown): SectionColorMap => {
    const map = createEmptySectionColorMap();
    if (!value || typeof value !== 'object') return map;
    const record = value as Record<string, unknown>;
    for (const key of SECTION_COLOR_KEYS) {
        const raw = record[key];
        if (Array.isArray(raw)) {
            map[key] = raw
                .map((section) =>
                    typeof section === 'number' ? String(section) : section,
                )
                .filter((section): section is string => typeof section === 'string');
        } else if (typeof raw === 'string') {
            map[key] = [raw];
        } else if (typeof raw === 'number') {
            map[key] = [String(raw)];
        }
    }
    return map;
};

export const parseSectionColorsFromFrontmatter = (
    frontmatter: string,
): SectionColorMap => {
    if (!frontmatter.trim()) return createEmptySectionColorMap();
    const content = stripFrontmatter(frontmatter);
    if (!content) return createEmptySectionColorMap();
    let parsed: unknown;
    try {
        parsed = parseYaml(content);
    } catch {
        return createEmptySectionColorMap();
    }
    if (!parsed || typeof parsed !== 'object') {
        return createEmptySectionColorMap();
    }
    const record = parsed as Record<string, unknown>;
    return normalizeSectionColorMap(record[SECTION_COLORS_FRONTMATTER_KEY]);
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
        if (map[key].length > 0) {
            result[key] = map[key];
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
        next[colorKey] = [...next[colorKey], section];
    }
    return next;
};

export const writeSectionColorsToFrontmatter = async (
    view: MandalaView,
    map: SectionColorMap,
) => {
    if (!view.file) return;
    const serialized = serializeSectionColorMap(map);
    await view.plugin.app.fileManager.processFrontMatter(
        view.file,
        (frontmatter) => {
            if (Object.keys(serialized).length === 0) {
                delete frontmatter[SECTION_COLORS_FRONTMATTER_KEY];
            } else {
                frontmatter[SECTION_COLORS_FRONTMATTER_KEY] = serialized;
            }
        },
    );
};
