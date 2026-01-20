import type { MandalaGridOrientation } from 'src/stores/settings/settings-type';

export const coreSlots = ['2', '3', '4', '5', '1', '6', '7', '8', '9'] as const;

export const childSlots = [
    '1',
    '2',
    '3',
    '4',
    null,
    '5',
    '6',
    '7',
    '8',
] as const;

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

export const themeGrid = [
    ['1', '2', '3'],
    ['4', null, '5'],
    ['6', '7', '8'],
] as const;

export const themeBlocks = [
    '2',
    '3',
    '4',
    '5',
    null,
    '6',
    '7',
    '8',
    '9',
] as const;

export const positions: Record<string, { row: number; col: number } | undefined> =
    {
        '1': { row: 1, col: 1 },
        '2': { row: 0, col: 0 },
        '3': { row: 0, col: 1 },
        '4': { row: 0, col: 2 },
        '5': { row: 1, col: 0 },
        '6': { row: 1, col: 2 },
        '7': { row: 2, col: 0 },
        '8': { row: 2, col: 1 },
        '9': { row: 2, col: 2 },
    };

export const slotPositions: Record<
    string,
    { row: number; col: number } | undefined
> = {
    '1': { row: 0, col: 0 },
    '2': { row: 0, col: 1 },
    '3': { row: 0, col: 2 },
    '4': { row: 1, col: 0 },
    '5': { row: 1, col: 2 },
    '6': { row: 2, col: 0 },
    '7': { row: 2, col: 1 },
    '8': { row: 2, col: 2 },
};

const buildCoreSlots = (
    grid: readonly (readonly string[])[],
): string[] => grid.flat();

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

const layoutMaps: Record<
    MandalaGridOrientation,
    {
        coreGrid: readonly (readonly string[])[];
        coreSlots: string[];
        positions: Record<string, { row: number; col: number }>;
        themeBlocks: Array<string | null>;
    }
> = {
    'left-to-right': {
        coreGrid,
        coreSlots: buildCoreSlots(coreGrid),
        positions: buildPositions(coreGrid),
        themeBlocks: buildThemeBlocks(coreGrid),
    },
    'south-start': {
        coreGrid: coreGridSouthStart,
        coreSlots: buildCoreSlots(coreGridSouthStart),
        positions: buildPositions(coreGridSouthStart),
        themeBlocks: buildThemeBlocks(coreGridSouthStart),
    },
};

export const getMandalaLayout = (orientation: MandalaGridOrientation) =>
    layoutMaps[orientation] ?? layoutMaps['left-to-right'];

export const posOfSection3x3 = (
    section: string,
    orientation: MandalaGridOrientation = 'left-to-right',
): { row: number; col: number } | null => {
    const pos = getMandalaLayout(orientation).positions[section];
    if (!pos) return null;
    return { row: pos.row, col: pos.col };
};

export const posOfSection9x9 = (
    section: string,
    orientation: MandalaGridOrientation = 'left-to-right',
): { row: number; col: number } | null => {
    const { positions: layoutPositions } = getMandalaLayout(orientation);
    if (section.includes('.')) {
        const [theme, slot] = section.split('.');
        const themePos = layoutPositions[theme];
        const slotPos = slotPositions[slot];
        if (!themePos || !slotPos) return null;
        return {
            row: themePos.row * 3 + slotPos.row,
            col: themePos.col * 3 + slotPos.col,
        };
    }
    if (section === '1') {
        return { row: 4, col: 4 };
    }
    const themePos = layoutPositions[section];
    if (!themePos) return null;
    return { row: themePos.row * 3 + 1, col: themePos.col * 3 + 1 };
};

export const sectionAtCell9x9 = (
    row: number,
    col: number,
    orientation: MandalaGridOrientation = 'left-to-right',
): string | null => {
    const blockRow = Math.floor(row / 3);
    const blockCol = Math.floor(col / 3);
    const localRow = row % 3;
    const localCol = col % 3;
    const { coreGrid: layoutCoreGrid, themeBlocks: layoutThemeBlocks } =
        getMandalaLayout(orientation);

    if (blockRow === 1 && blockCol === 1) {
        return layoutCoreGrid[localRow]?.[localCol] ?? null;
    }

    const theme = layoutThemeBlocks[blockRow * 3 + blockCol];
    if (!theme) return null;
    if (localRow === 1 && localCol === 1) return theme;
    const slot = themeGrid[localRow]?.[localCol];
    if (!slot) return null;
    return `${theme}.${slot}`;
};
