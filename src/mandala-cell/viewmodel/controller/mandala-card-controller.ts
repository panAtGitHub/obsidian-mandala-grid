import type { CellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';
import type { CellRuntimeContext } from 'src/view/cell-runtime-context';

type SelectMandalaCardOptions = {
    cellRuntime: CellRuntimeContext;
    nodeId: string;
    isMobile: boolean;
    event: MouseEvent;
};

type ClickMandalaCardOptions = SelectMandalaCardOptions & {
    swapActive: boolean;
};

type DoubleClickMandalaCardOptions = {
    cellRuntime: CellRuntimeContext;
    nodeId: string;
    displaySection: string;
    interactionPolicy: CellInteractionPolicy;
    isMobile: boolean;
    showDetailSidebar: boolean;
    event: MouseEvent;
};

export const selectMandalaCard = ({
    cellRuntime,
    nodeId,
    isMobile,
    event,
}: SelectMandalaCardOptions) => {
    cellRuntime.activateMainSplitNode(nodeId, event);

    if (isMobile) {
        return;
    }
};

export const clickMandalaCard = ({
    cellRuntime,
    nodeId,
    isMobile,
    swapActive,
    event,
}: ClickMandalaCardOptions) => {
    if (swapActive) {
        return;
    }

    selectMandalaCard({
        cellRuntime,
        nodeId,
        isMobile,
        event,
    });
};

export const doubleClickMandalaCard = ({
    cellRuntime,
    nodeId,
    displaySection,
    interactionPolicy,
    isMobile,
    showDetailSidebar,
    event,
}: DoubleClickMandalaCardOptions) => {
    if (isMobile) {
        if (interactionPolicy.mobileDoubleClickAction === 'subgrid-navigation') {
            if (cellRuntime.isMobileGridCenter(nodeId, displaySection)) {
                cellRuntime.exitMobileSubgrid();
            } else {
                cellRuntime.enterMobileSubgrid(nodeId);
            }
        }
        return;
    }

    selectMandalaCard({
        cellRuntime,
        nodeId,
        isMobile,
        event,
    });

    if (showDetailSidebar) {
        cellRuntime.enableDetailSidebarEdit(nodeId);
        return;
    }

    cellRuntime.enableMainSplitEdit(nodeId);
};
