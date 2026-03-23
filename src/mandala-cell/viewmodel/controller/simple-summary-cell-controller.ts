import { handleSwapPointerStart } from 'src/mandala-cell/viewmodel/controller/swap-controller';
import type { SimpleSummaryCellModel } from 'src/mandala-cell/model/simple-summary-cell-model';
import type { MandalaSwapInteractionState } from 'src/mandala-interaction/helpers/mandala-swap';
import type { CellRuntimeContext } from 'src/view/cell-runtime-context';

type ActivateSimpleSummaryCell = (cell: SimpleSummaryCellModel) => void;

type SimpleSummaryPointerStartOptions = {
    cellRuntime: CellRuntimeContext;
    swapState: MandalaSwapInteractionState;
    cell: SimpleSummaryCellModel;
    event: MouseEvent | TouchEvent;
};

type SimpleSummaryClickOptions = {
    cellRuntime: CellRuntimeContext;
    swapActive: boolean;
    cell: SimpleSummaryCellModel;
    activateCell: ActivateSimpleSummaryCell;
};

type SimpleSummaryDoubleClickOptions = {
    cellRuntime: CellRuntimeContext;
    swapActive: boolean;
    isMobile: boolean;
    cell: SimpleSummaryCellModel;
    activateCell: ActivateSimpleSummaryCell;
};

export const clickSimpleSummaryCell = ({
    cellRuntime,
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

    cellRuntime.activateMandalaNode(cell.nodeId);
};

export const pointerStartSimpleSummaryCell = ({
    cellRuntime,
    swapState,
    cell,
    event,
}: SimpleSummaryPointerStartOptions) =>
    handleSwapPointerStart({
        cellRuntime,
        swapState,
        nodeId: cell.nodeId || null,
        event,
    });

export const doubleClickSimpleSummaryCell = ({
    cellRuntime,
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

    cellRuntime.openSidebarAndEditNode(cell.nodeId);
};
