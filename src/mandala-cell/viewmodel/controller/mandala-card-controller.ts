import { enableEditModeInMainSplit } from 'src/mandala-cell/viewmodel/actions/enable-edit-mode-in-main-split';
import { setActiveMainSplitNode } from 'src/mandala-cell/viewmodel/actions/set-active-main-split-node';
import {
    enterSubgridForNode,
    exitCurrentSubgrid,
    isGridCenter,
} from 'src/mandala-interaction/helpers/mobile-navigation';
import { enableSidebarEditorForNode } from 'src/mandala-interaction/helpers/node-editing';
import type { MandalaView } from 'src/view/view';
import type { CellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';

type SelectMandalaCardOptions = {
    view: MandalaView;
    nodeId: string;
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
    interactionPolicy: CellInteractionPolicy;
    isMobile: boolean;
    showDetailSidebar: boolean;
    event: MouseEvent;
};

export const selectMandalaCard = ({
    view,
    nodeId,
    isMobile,
    event,
}: SelectMandalaCardOptions) => {
    setActiveMainSplitNode(view, nodeId, event);

    if (isMobile) {
        return;
    }
};

export const clickMandalaCard = ({
    view,
    nodeId,
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
        isMobile,
        event,
    });
};

export const doubleClickMandalaCard = ({
    view,
    nodeId,
    displaySection,
    interactionPolicy,
    isMobile,
    showDetailSidebar,
    event,
}: DoubleClickMandalaCardOptions) => {
    if (isMobile) {
        if (interactionPolicy.mobileDoubleClickAction === 'subgrid-navigation') {
            if (isGridCenter(view, nodeId, displaySection)) {
                exitCurrentSubgrid(view);
            } else {
                enterSubgridForNode(view, nodeId);
            }
        }
        return;
    }

    selectMandalaCard({
        view,
        nodeId,
        isMobile,
        event,
    });

    if (showDetailSidebar) {
        enableSidebarEditorForNode(view, nodeId);
        return;
    }

    enableEditModeInMainSplit(view, nodeId);
};
