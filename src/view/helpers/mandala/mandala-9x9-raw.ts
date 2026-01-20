import type { MandalaGridOrientation } from 'src/stores/settings/settings-type';
import { getMandalaLayout } from 'src/view/helpers/mandala/mandala-grid';

export type MandalaCell = { row: number; col: number };

export const isCenter3x3 = (row: number, col: number) =>
    row >= 3 && row <= 5 && col >= 3 && col <= 5;

/**
 * 9×9「原始模式」映射：
 * - 中间 3×3（核心九宫）全部视为“虚格子”，不映射到任何 section（避免 2..9 主题格在 UI 里出现重复映射）。
 * - 其余 8 个主题块：每块 3×3 的中心格映射到主题 section（2..9），其他 8 格映射到 <theme>.<1..8>。
 */
export const sectionAtRaw9x9Cell = (
    row: number,
    col: number,
    orientation: MandalaGridOrientation = 'left-to-right',
): string | null => {
    if (isCenter3x3(row, col)) return null;
    const blockRow = Math.floor(row / 3);
    const blockCol = Math.floor(col / 3);
    const localRow = row % 3;
    const localCol = col % 3;

    const { themeBlocks, themeGrid } = getMandalaLayout(orientation);
    const theme = themeBlocks[blockRow * 3 + blockCol];
    if (!theme) return null;
    if (localRow === 1 && localCol === 1) return theme;
    const slot = themeGrid[localRow]?.[localCol];
    if (!slot) return null;
    return `${theme}.${slot}`;
};

export const posOfRaw9x9Section = (
    section: string,
    orientation: MandalaGridOrientation = 'left-to-right',
): MandalaCell | null => {
    if (section === '1') return null;
    if (!section) return null;
    const { positions, slotPositions } = getMandalaLayout(orientation);
    if (section.includes('.')) {
        const [theme, slot] = section.split('.');
        const themePos = positions[theme];
        const slotPos = slotPositions[slot];
        if (!themePos || !slotPos) return null;
        const cell = {
            row: themePos.row * 3 + slotPos.row,
            col: themePos.col * 3 + slotPos.col,
        };
        return isCenter3x3(cell.row, cell.col) ? null : cell;
    }
    const themePos = positions[section];
    if (!themePos) return null;
    const cell = { row: themePos.row * 3 + 1, col: themePos.col * 3 + 1 };
    return isCenter3x3(cell.row, cell.col) ? null : cell;
};

export const nextRaw9x9Cell = (
    current: MandalaCell,
    direction: 'up' | 'down' | 'left' | 'right',
): MandalaCell | null => {
    const deltas: Record<typeof direction, { dr: number; dc: number }> = {
        up: { dr: -1, dc: 0 },
        down: { dr: 1, dc: 0 },
        left: { dr: 0, dc: -1 },
        right: { dr: 0, dc: 1 },
    };
    const { dr, dc } = deltas[direction];
    let row = current.row + dr;
    let col = current.col + dc;

    while (row >= 0 && row <= 8 && col >= 0 && col <= 8) {
        if (!isCenter3x3(row, col)) return { row, col };
        row += dr;
        col += dc;
    }
    return null;
};
