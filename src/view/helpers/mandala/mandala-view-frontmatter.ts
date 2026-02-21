import { parseYaml } from 'obsidian';
import { MandalaGridOrientation } from 'src/stores/settings/settings-type';

export const MANDALA_VIEW_FRONTMATTER_KEY = 'mandala_view';

type MandalaViewFrontmatterRecord = {
    grid_orientation?: unknown;
    last_active_section?: unknown;
};

export type MandalaViewFrontmatterState = {
    gridOrientation: MandalaGridOrientation | null;
    lastActiveSection: string | null;
};

const VALID_GRID_ORIENTATIONS: MandalaGridOrientation[] = [
    'left-to-right',
    'south-start',
    'bottom-to-top',
];

const stripFrontmatterMarkers = (frontmatter: string) =>
    frontmatter
        .replace(/^---\n/, '')
        .replace(/\n---\n?$/, '')
        .trim();

const parseFrontmatterRecord = (frontmatter: string) => {
    if (!frontmatter.trim()) return {};
    const content = stripFrontmatterMarkers(frontmatter);
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

const isMandalaGridOrientation = (
    value: unknown,
): value is MandalaGridOrientation =>
    typeof value === 'string' &&
    VALID_GRID_ORIENTATIONS.includes(value as MandalaGridOrientation);

const normalizeLastActiveSection = (value: unknown): string | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^\d+(?:\.\d+)*$/.test(trimmed)) return null;
    return trimmed;
};

const getMandalaViewRecord = (
    frontmatterRecord: Record<string, unknown>,
): MandalaViewFrontmatterRecord | null => {
    const raw = frontmatterRecord[MANDALA_VIEW_FRONTMATTER_KEY];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return null;
    }
    return raw as MandalaViewFrontmatterRecord;
};

export const parseMandalaViewFrontmatterState = (
    frontmatter: string,
): MandalaViewFrontmatterState => {
    const frontmatterRecord = parseFrontmatterRecord(frontmatter);
    const mandalaView = getMandalaViewRecord(frontmatterRecord);
    if (!mandalaView) {
        return {
            gridOrientation: null,
            lastActiveSection: null,
        };
    }

    return {
        gridOrientation: isMandalaGridOrientation(mandalaView.grid_orientation)
            ? mandalaView.grid_orientation
            : null,
        lastActiveSection: normalizeLastActiveSection(
            mandalaView.last_active_section,
        ),
    };
};
