import type { MandalaGridOrientation } from 'src/stores/settings/settings-type';

export const coreGrid = [
    ['2', '3', '4'],
    ['5', '1', '6'],
    ['7', '8', '9'],
] as const;

const coreGridSouthStart = [
    ['7', '4', '8'],
    ['3', '1', '5'],
    ['6', '2', '9'],
] as const;

const coreGridBottomToTop = [
    ['7', '8', '9'],
    ['5', '1', '6'],
    ['2', '3', '4'],
] as const;

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

type MandalaLayout = {
    coreGrid: readonly (readonly string[])[];
    coreSlots: string[];
    positions: Record<string, { row: number; col: number }>;
    themeBlocks: Array<string | null>;
    themeGrid: Array<Array<string | null>>;
    slotPositions: Record<string, { row: number; col: number }>;
    childSlots: Array<string | null>;
};

const createLayout = (
    grid: readonly (readonly string[])[],
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
    };
};

const layoutMaps: Record<MandalaGridOrientation, MandalaLayout> = {
    'left-to-right': createLayout(coreGrid),
    'south-start': createLayout(coreGridSouthStart),
    'bottom-to-top': createLayout(coreGridBottomToTop),
};

export const getMandalaLayout = (orientation: MandalaGridOrientation) =>
    layoutMaps[orientation] ?? layoutMaps['left-to-right'];

export const coreSlots = layoutMaps['left-to-right'].coreSlots;
export const themeGrid = layoutMaps['left-to-right'].themeGrid;
export const slotPositions = layoutMaps['left-to-right'].slotPositions;
export const childSlots = layoutMaps['left-to-right'].childSlots;
export const positions = layoutMaps['left-to-right'].positions;
export const themeBlocks = layoutMaps['left-to-right'].themeBlocks;

export const posOfSection3x3 = (
    section: string,
    orientation: MandalaGridOrientation = 'left-to-right',
): { row: number; col: number } | null => {
    const { slotPositions } = getMandalaLayout(orientation);
    if (section === '1') return { row: 1, col: 1 };
    if (!section.includes('.')) return null;
    const parts = section.split('.');
    const slot = parts[parts.length - 1];
    if (!slot) return null;
    return slotPositions[slot] ?? null;
};

export const posOfSection9x9 = (
    section: string,
    orientation: MandalaGridOrientation = 'left-to-right',
    baseTheme = '1',
): { row: number; col: number } | null => {
    const { slotPositions } = getMandalaLayout(orientation);

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
    orientation: MandalaGridOrientation = 'left-to-right',
    baseTheme = '1',
): string | null => {
    const blockRow = Math.floor(row / 3);
    const blockCol = Math.floor(col / 3);
    const localRow = row % 3;
    const localCol = col % 3;
    const { themeGrid: layoutThemeGrid } = getMandalaLayout(orientation);

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
