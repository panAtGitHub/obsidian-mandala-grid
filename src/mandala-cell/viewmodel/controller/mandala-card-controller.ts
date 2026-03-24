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
    onMobileDoubleClick: MandalaCardMobileDoubleClickHandler | null;
    isMobile: boolean;
    showDetailSidebar: boolean;
    event: MouseEvent;
};

export type MandalaCardMobileDoubleClickHandler = (args: {
    nodeId: string;
    displaySection: string;
    event: MouseEvent;
}) => void;

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
    onMobileDoubleClick,
    isMobile,
    showDetailSidebar,
    event,
}: DoubleClickMandalaCardOptions) => {
    if (isMobile) {
        onMobileDoubleClick?.({
            nodeId,
            displaySection,
            event,
        });
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
