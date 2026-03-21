import type {
    CellGridPosition,
    CellSectionIndicatorVariant,
    CellStyle,
} from 'src/cell/model/card-types';

type SharedCardViewModel = {
    selected: boolean;
    pinned: boolean;
    style: CellStyle;
};

export type MandalaCardViewModel = SharedCardViewModel & {
    nodeId: string;
    section: string;
    active: boolean;
    editing: boolean;
    sectionColor: string | null;
    preserveActiveBackground: boolean;
    sectionIndicatorVariant: CellSectionIndicatorVariant;
    gridCell: CellGridPosition | null;
};
