import type {
    CellGridPosition,
    CellStyle,
} from 'src/mandala-cell/model/card-types';
import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import type { CellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';

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
