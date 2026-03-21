import type { ActiveStatus } from 'src/views/view-columns/components/active-status.enum';
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

export type ClassicCardViewModel = SharedCardViewModel & {
    nodeId: string;
    section: string;
    activeStatus: ActiveStatus | null;
    editing: boolean;
    confirmDisableEdit: boolean;
    confirmDelete: boolean;
    isInSidebar: boolean;
    isSearchMatch: boolean;
    alwaysShowCardButtons: boolean;
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
