import type {
    CellGridPosition,
    CellStyle,
} from 'src/cell/model/card-types';
import type { CellDisplayPolicy } from 'src/cell/model/cell-display-policy';
import type { CellInteractionPolicy } from 'src/cell/viewmodel/policies/cell-interaction-policy';

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
    metaAccentColor: string | null;
    displayPolicy: CellDisplayPolicy;
    interactionPolicy: CellInteractionPolicy;
    gridCell: CellGridPosition | null;
};
