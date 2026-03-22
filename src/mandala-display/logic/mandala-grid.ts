import type {
    BuiltinMandalaGridOrientation,
    MandalaCustomLayout,
    MandalaGridOrientation,
} from 'src/mandala-settings/state/settings-type';
import {
    BUILTIN_MANDALA_LAYOUT_PATTERNS,
    coreGridToPattern,
    findMandalaCustomLayout,
    getFallbackCustomPattern,
    normalizeCustomMandalaPattern,
    patternToCoreGrid,
    resolveMandalaLayoutId,
} from 'src/mandala-display/logic/grid-layout';

type MandalaLayout = {
    coreGrid: readonly (readonly string[])[];
    coreSlots: string[];
    positions: Record<string, { row: number; col: number }>;
    themeBlocks: Array<string | null>;
    themeGrid: Array<Array<string | null>>;
    slotPositions: Record<string, { row: number; col: number }>;
    childSlots: Array<string | null>;
    previewPattern: string;
};

const buildCoreSlots = (
    grid: readonly (readonly string[])[],
): string[] => grid.flat();

const buildThemeGrid = (
    grid: readonly (readonly string[])[],
): Array<Array<string | null>> =>
    grid.map((row) =>
        row.map((section) => (section === '1' ? null : String(+section - 1))),
    );

const buildChildSlots = (grid: Array<Array<string | null>>) =>
    grid.flat().map((slot) => slot ?? null);

const buildPositions = (
    grid: readonly (readonly string[])[],
): Record<string, { row: number; col: number }> => {
    const mapping: Record<string, { row: number; col: number }> = {};
    grid.forEach((row, rowIndex) => {
        row.forEach((section, colIndex) => {
            mapping[section] = { row: rowIndex, col: colIndex };
        });
    });
    return mapping;
};

const buildThemeBlocks = (
    grid: readonly (readonly string[])[],
): Array<string | null> =>
    grid.flat().map((section) => (section === '1' ? null : section));

const buildSlotPositions = (
    grid: Array<Array<string | null>>,
): Record<string, { row: number; col: number }> => {
    const mapping: Record<string, { row: number; col: number }> = {};
    grid.forEach((row, rowIndex) => {
        row.forEach((section, colIndex) => {
            if (!section) return;
            mapping[section] = { row: rowIndex, col: colIndex };
        });
    });
    return mapping;
};

const createLayout = (
    grid: readonly (readonly string[])[],
    previewPattern = coreGridToPattern(grid),
): MandalaLayout => {
    const themeGrid = buildThemeGrid(grid);
    return {
        coreGrid: grid,
        coreSlots: buildCoreSlots(grid),
        positions: buildPositions(grid),
        themeBlocks: buildThemeBlocks(grid),
        themeGrid,
        slotPositions: buildSlotPositions(themeGrid),
        childSlots: buildChildSlots(themeGrid),
        previewPattern,
    };
};

const builtinLayoutMaps: Record<BuiltinMandalaGridOrientation, MandalaLayout> = {
    'left-to-right': createLayout(
        patternToCoreGrid(BUILTIN_MANDALA_LAYOUT_PATTERNS['left-to-right']),
        BUILTIN_MANDALA_LAYOUT_PATTERNS['left-to-right'],
    ),
    'south-start': createLayout(
        patternToCoreGrid(BUILTIN_MANDALA_LAYOUT_PATTERNS['south-start']),
        BUILTIN_MANDALA_LAYOUT_PATTERNS['south-start'],
    ),
};

const customLayoutCache = new Map<string, MandalaLayout>();

const getCustomMandalaLayout = (pattern: string) => {
    const normalizedPattern = normalizeCustomMandalaPattern(
        pattern || getFallbackCustomPattern(),
    );
    const cached = customLayoutCache.get(normalizedPattern);
    if (cached) return cached;
    const layout = createLayout(
        patternToCoreGrid(normalizedPattern),
        normalizedPattern,
    );
    customLayoutCache.set(normalizedPattern, layout);
    return layout;
};

export const getBuiltinMandalaLayout = (
    orientation: BuiltinMandalaGridOrientation,
) => builtinLayoutMaps[orientation];

export const getMandalaLayout = (
    orientation: MandalaGridOrientation,
    customPattern = getFallbackCustomPattern(),
) => {
    if (orientation === 'south-start') {
        return builtinLayoutMaps['south-start'];
    }
    if (orientation === 'custom') {
        return getCustomMandalaLayout(customPattern);
    }
    return builtinLayoutMaps['left-to-right'];
};

export const getMandalaLayoutById = (
    selectedLayoutId: string | null | undefined,
    customLayouts: MandalaCustomLayout[],
) => {
    const resolvedId = resolveMandalaLayoutId(selectedLayoutId, customLayouts);
    if (resolvedId.startsWith('custom:')) {
        const customLayout = findMandalaCustomLayout(customLayouts, resolvedId);
        return getCustomMandalaLayout(customLayout?.pattern ?? getFallbackCustomPattern());
    }
    return getMandalaLayout(
        resolvedId === 'builtin:south-start' ? 'south-start' : 'left-to-right',
    );
};

export const coreSlots = builtinLayoutMaps['left-to-right'].coreSlots;
export const themeGrid = builtinLayoutMaps['left-to-right'].themeGrid;
export const slotPositions = builtinLayoutMaps['left-to-right'].slotPositions;
export const childSlots = builtinLayoutMaps['left-to-right'].childSlots;
export const positions = builtinLayoutMaps['left-to-right'].positions;
export const themeBlocks = builtinLayoutMaps['left-to-right'].themeBlocks;

export const posOfSection3x3 = (
    section: string,
    selectedLayoutIdOrOrientation: string,
    customLayouts: MandalaCustomLayout[] = [],
): { row: number; col: number } | null => {
    const layout = selectedLayoutIdOrOrientation.startsWith('builtin:') ||
        selectedLayoutIdOrOrientation.startsWith('custom:')
        ? getMandalaLayoutById(selectedLayoutIdOrOrientation, customLayouts)
        : getMandalaLayout(
              selectedLayoutIdOrOrientation as MandalaGridOrientation,
              customLayouts[0]?.pattern,
          );
    const { slotPositions } = layout;
    if (section === '1') return { row: 1, col: 1 };
    if (!section.includes('.')) return null;
    const parts = section.split('.');
    const slot = parts[parts.length - 1];
    if (!slot) return null;
    return slotPositions[slot] ?? null;
};

export const posOfSection9x9 = (
    section: string,
    selectedLayoutIdOrOrientation: string,
    baseTheme = '1',
    customLayouts: MandalaCustomLayout[] = [],
): { row: number; col: number } | null => {
    const layout = selectedLayoutIdOrOrientation.startsWith('builtin:') ||
        selectedLayoutIdOrOrientation.startsWith('custom:')
        ? getMandalaLayoutById(selectedLayoutIdOrOrientation, customLayouts)
        : getMandalaLayout(
              selectedLayoutIdOrOrientation as MandalaGridOrientation,
              customLayouts[0]?.pattern,
          );
    const { slotPositions } = layout;

    if (section === baseTheme) return { row: 4, col: 4 };
    if (!section.startsWith(`${baseTheme}.`)) return null;

    const suffix = section.slice(baseTheme.length + 1);
    const parts = suffix.split('.');
    const blockSlot = parts[0];
    const blockPos = slotPositions[blockSlot];
    if (!blockPos) return null;

    if (parts.length === 1) {
        return { row: blockPos.row * 3 + 1, col: blockPos.col * 3 + 1 };
    }
    if (parts.length !== 2) return null;

    const localSlot = parts[1];
    const localPos = slotPositions[localSlot];
    if (!localPos) return null;
    return {
        row: blockPos.row * 3 + localPos.row,
        col: blockPos.col * 3 + localPos.col,
    };
};

export const sectionAtCell9x9 = (
    row: number,
    col: number,
    selectedLayoutIdOrOrientation: string,
    baseTheme = '1',
    customLayouts: MandalaCustomLayout[] = [],
): string | null => {
    const layout = selectedLayoutIdOrOrientation.startsWith('builtin:') ||
        selectedLayoutIdOrOrientation.startsWith('custom:')
        ? getMandalaLayoutById(selectedLayoutIdOrOrientation, customLayouts)
        : getMandalaLayout(
              selectedLayoutIdOrOrientation as MandalaGridOrientation,
              customLayouts[0]?.pattern,
          );
    const blockRow = Math.floor(row / 3);
    const blockCol = Math.floor(col / 3);
    const localRow = row % 3;
    const localCol = col % 3;
    const { themeGrid: layoutThemeGrid } = layout;

    const blockSlot =
        blockRow === 1 && blockCol === 1
            ? null
            : layoutThemeGrid[blockRow]?.[blockCol] ?? null;
    const theme = blockSlot ? `${baseTheme}.${blockSlot}` : baseTheme;
    if (localRow === 1 && localCol === 1) return theme;
    const slot = layoutThemeGrid[localRow]?.[localCol];
    if (!slot) return null;
    return `${theme}.${slot}`;
};
