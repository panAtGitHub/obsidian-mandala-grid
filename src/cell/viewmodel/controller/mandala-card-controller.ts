import { enableEditModeInMainSplit } from 'src/cell/viewmodel/actions/enable-edit-mode-in-main-split';
import { setActiveMainSplitNode } from 'src/cell/viewmodel/actions/set-active-main-split-node';
import { activateMandalaGridCell } from 'src/cell/viewmodel/policies/cell-activation-policy';
import type { CellGridPosition } from 'src/cell/model/card-types';
import {
    enterSubgridForNode,
    exitCurrentSubgrid,
    isGridCenter,
} from 'src/helpers/views/mandala/mobile-navigation';
import { enableSidebarEditorForNode } from 'src/helpers/views/mandala/node-editing';
import type { MandalaView } from 'src/view/view';

type SelectMandalaCardOptions = {
    view: MandalaView;
    nodeId: string;
    gridCell: CellGridPosition | null;
    isMobile: boolean;
    event: MouseEvent;
};

type ClickMandalaCardOptions = SelectMandalaCardOptions & {
    swapActive: boolean;
};

type DoubleClickMandalaCardOptions = {
    view: MandalaView;
    nodeId: string;
    displaySection: string;
    gridCell: CellGridPosition | null;
    isMobile: boolean;
    showDetailSidebar: boolean;
    event: MouseEvent;
};

export const selectMandalaCard = ({
    view,
    nodeId,
    gridCell,
    isMobile,
    event,
}: SelectMandalaCardOptions) => {
    activateMandalaGridCell(view, gridCell);
    setActiveMainSplitNode(view, nodeId, event);

    if (isMobile) {
        return;
    }
};

export const clickMandalaCard = ({
    view,
    nodeId,
    gridCell,
    isMobile,
    swapActive,
    event,
}: ClickMandalaCardOptions) => {
    if (swapActive) {
        return;
    }

    selectMandalaCard({
        view,
        nodeId,
        gridCell,
        isMobile,
        event,
    });
};

export const doubleClickMandalaCard = ({
    view,
    nodeId,
    displaySection,
    gridCell,
    isMobile,
    showDetailSidebar,
    event,
}: DoubleClickMandalaCardOptions) => {
    if (isMobile) {
        if (isGridCenter(view, nodeId, displaySection)) {
            exitCurrentSubgrid(view);
        } else {
            enterSubgridForNode(view, nodeId);
        }
        return;
    }

    selectMandalaCard({
        view,
        nodeId,
        gridCell,
        isMobile,
        event,
    });

    if (showDetailSidebar) {
        enableSidebarEditorForNode(view, nodeId);
        return;
    }

    enableEditModeInMainSplit(view, nodeId);
};
