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
    // 用户自定义色应用透明度后的最终背景输入；没有自定义色时为 null。
    sectionColor: string | null;
    metaAccentColor: string | null;
    displayPolicy: CellDisplayPolicy;
    interactionPolicy: CellInteractionPolicy;
    gridCell: CellGridPosition | null;
};
