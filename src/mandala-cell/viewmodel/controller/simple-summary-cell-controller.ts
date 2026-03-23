import { handleSwapPointerStart } from 'src/mandala-cell/viewmodel/controller/swap-controller';
import type { SimpleSummaryCellModel } from 'src/mandala-cell/model/simple-summary-cell-model';
import {
    openSidebarAndEditMandalaNode,
    setActiveMandalaNode,
} from 'src/mandala-interaction/helpers/node-editing';
import type { MandalaSwapInteractionState } from 'src/mandala-interaction/helpers/mandala-swap';
import type { MandalaView } from 'src/view/view';

type ActivateSimpleSummaryCell = (cell: SimpleSummaryCellModel) => void;

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
    activateCell: ActivateSimpleSummaryCell;
};

type SimpleSummaryDoubleClickOptions = {
    view: MandalaView;
    swapActive: boolean;
    isMobile: boolean;
    cell: SimpleSummaryCellModel;
    activateCell: ActivateSimpleSummaryCell;
};

export const clickSimpleSummaryCell = ({
    view,
    swapActive,
    cell,
    activateCell,
}: SimpleSummaryClickOptions) => {
    if (swapActive) {
        return;
    }

    activateCell(cell);

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
    activateCell,
}: SimpleSummaryDoubleClickOptions) => {
    if (swapActive) {
        return;
    }

    if (!cell.nodeId) {
        activateCell(cell);
        return;
    }

    if (isMobile) {
        return;
    }

    openSidebarAndEditMandalaNode(view, cell.nodeId);
};
