import type { ClassicCardRenderModel } from 'src/cell/model/card-render-model';
import type { CellStyle } from 'src/cell/model/card-types';
import { ActiveStatus } from 'src/views/view-columns/components/active-status.enum';

type BuildClassicCardRenderModelOptions = {
    active: ActiveStatus | null;
    editing: boolean;
    style: CellStyle;
};

export const buildClassicCardRenderModel = ({
    active,
    editing,
    style,
}: BuildClassicCardRenderModelOptions): ClassicCardRenderModel => {
    const showInlineEditor = active === ActiveStatus.node && editing;

    return {
        cardStyle: undefined,
        showInlineEditor,
        showContent: !showInlineEditor,
        style,
        showCardButtons: true,
        showTreeIndex: true,
    };
};
