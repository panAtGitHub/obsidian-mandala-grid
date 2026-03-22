import { handleSwapPointerStart } from 'src/mandala-cell/viewmodel/controller/swap-controller';
import type { SimpleSummaryCellModel } from 'src/mandala-cell/model/simple-summary-cell-model';
import {
    openSidebarAndEditMandalaNode,
    setActiveMandalaNode,
} from 'src/mandala-interaction/helpers/node-editing';
import { setActiveCell9x9 } from 'src/mandala-interaction/helpers/set-active-cell-9x9';
import type { MandalaSwapInteractionState } from 'src/mandala-interaction/helpers/mandala-swap';
import type { MandalaView } from 'src/view/view';

type SimpleSummaryPointerStartOptions = {
    view: MandalaView;
    swapState: MandalaSwapInteractionState;
    cell: SimpleSummaryCellModel;
    event: MouseEvent | TouchEvent;
};

type SimpleSummaryClickOptions = {
    view: MandalaView;
    swapActive: boolean;
    cell: SimpleSummaryCellModel;
};

type SimpleSummaryDoubleClickOptions = {
    view: MandalaView;
    swapActive: boolean;
    isMobile: boolean;
    cell: SimpleSummaryCellModel;
};

export const clickSimpleSummaryCell = ({
    view,
    swapActive,
    cell,
}: SimpleSummaryClickOptions) => {
    if (swapActive) {
        return;
    }

    setActiveCell9x9(view, { row: cell.row, col: cell.col });

    if (!cell.nodeId) {
        return;
    }

    setActiveMandalaNode(view, cell.nodeId);
};

export const pointerStartSimpleSummaryCell = ({
    view,
    swapState,
    cell,
    event,
}: SimpleSummaryPointerStartOptions) =>
    handleSwapPointerStart({
        view,
        swapState,
        nodeId: cell.nodeId || null,
        event,
    });

export const doubleClickSimpleSummaryCell = ({
    view,
    swapActive,
    isMobile,
    cell,
}: SimpleSummaryDoubleClickOptions) => {
    if (swapActive) {
        return;
    }

    if (!cell.nodeId) {
        setActiveCell9x9(view, { row: cell.row, col: cell.col });
        return;
    }

    if (isMobile) {
        return;
    }

    openSidebarAndEditMandalaNode(view, cell.nodeId);
};
