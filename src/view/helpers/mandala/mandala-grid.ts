export const coreSlots = ['2', '3', '4', '5', '1', '6', '7', '8', '9'] as const;

export const childSlots = ['1', '2', '3', '4', null, '5', '6', '7', '8'] as const;

export const coreGrid = [
    ['2', '3', '4'],
    ['5', '1', '6'],
    ['7', '8', '9'],
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

export const posOfSection3x3 = (
    section: string,
): { row: number; col: number } | null => {
    const pos = positions[section];
    if (!pos) return null;
    return { row: pos.row, col: pos.col };
};

export const posOfSection9x9 = (
    section: string,
): { row: number; col: number } | null => {
    if (section.includes('.')) {
        const [theme, slot] = section.split('.');
        const themePos = positions[theme];
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
    const themePos = positions[section];
    if (!themePos) return null;
    return { row: 3 + themePos.row, col: 3 + themePos.col };
};

export const sectionAtCell9x9 = (row: number, col: number): string | null => {
    const blockRow = Math.floor(row / 3);
    const blockCol = Math.floor(col / 3);
    const localRow = row % 3;
    const localCol = col % 3;

    if (blockRow === 1 && blockCol === 1) {
        return coreGrid[localRow]?.[localCol] ?? null;
    }

    const theme = themeBlocks[blockRow * 3 + blockCol];
    if (!theme) return null;
    if (localRow === 1 && localCol === 1) return theme;
    const slot = themeGrid[localRow]?.[localCol];
    if (!slot) return null;
    return `${theme}.${slot}`;
};
