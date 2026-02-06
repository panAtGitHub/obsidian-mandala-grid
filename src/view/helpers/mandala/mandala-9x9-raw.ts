import type { MandalaGridOrientation } from 'src/stores/settings/settings-type';
import {
    posOfSection9x9,
    sectionAtCell9x9,
} from 'src/view/helpers/mandala/mandala-grid';

export type MandalaCell = { row: number; col: number };

/**
 * 9×9「原始模式」映射：
 * - 当前主题为中心，其余 8 块为子主题的子九宫格。
 */
export const sectionAtRaw9x9Cell = (
    row: number,
    col: number,
    orientation: MandalaGridOrientation = 'left-to-right',
    baseTheme = '1',
): string | null => {
    return sectionAtCell9x9(row, col, orientation, baseTheme);
};

export const posOfRaw9x9Section = (
    section: string,
    orientation: MandalaGridOrientation = 'left-to-right',
    baseTheme = '1',
): MandalaCell | null => {
    if (!section) return null;
    return posOfSection9x9(section, orientation, baseTheme);
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
    const row = current.row + dr;
    const col = current.col + dc;

    while (row >= 0 && row <= 8 && col >= 0 && col <= 8) {
        return { row, col };
    }
    return null;
};
