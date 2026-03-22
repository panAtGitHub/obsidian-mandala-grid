import type { NodeStyle } from 'src/stores/settings/types/style-rules-types';

export type CellGridMode = '9x9' | 'nx9' | 'week-7x9';

export type CellGridPosition = {
    mode: CellGridMode;
    row: number;
    col: number;
    page?: number;
};

export type CellSectionIndicatorVariant =
    | 'plain'
    | 'plain-with-pin'
    | 'section-capsule';

export type CellTextTone = 'dark' | 'light';

export type CellStyle = NodeStyle | undefined;
