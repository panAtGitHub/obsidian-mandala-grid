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
    const pos = getMandalaLayout(orientation).positions[section];
    if (!pos) return null;
    return { row: pos.row, col: pos.col };
};

export const posOfSection9x9 = (
    section: string,
    orientation: MandalaGridOrientation = 'left-to-right',
): { row: number; col: number } | null => {
    const { positions: layoutPositions, slotPositions: layoutSlotPositions } =
        getMandalaLayout(orientation);
    if (section.includes('.')) {
        const [theme, slot] = section.split('.');
        const themePos = layoutPositions[theme];
        const slotPos = layoutSlotPositions[slot];
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
    const {
        coreGrid: layoutCoreGrid,
        themeBlocks: layoutThemeBlocks,
        themeGrid: layoutThemeGrid,
    } = getMandalaLayout(orientation);

    if (blockRow === 1 && blockCol === 1) {
        return layoutCoreGrid[localRow]?.[localCol] ?? null;
    }

    const theme = layoutThemeBlocks[blockRow * 3 + blockCol];
    if (!theme) return null;
    if (localRow === 1 && localCol === 1) return theme;
    const slot = layoutThemeGrid[localRow]?.[localCol];
    if (!slot) return null;
    return `${theme}.${slot}`;
};
