import {
    executeMandalaSwap,
    handleMandalaSwapNodeClick,
    shouldBlockMandalaNodeDoubleClickForSwap,
    type MandalaSwapInteractionState,
} from 'src/mandala-interaction/helpers/mandala-swap';
import type { MandalaView } from 'src/view/view';

type HandleSwapPointerStartOptions = {
    view: MandalaView;
    swapState: MandalaSwapInteractionState;
    nodeId: string | null;
    event: MouseEvent | TouchEvent;
};

export const handleSwapPointerStart = ({
    view,
    swapState,
    nodeId,
    event,
}: HandleSwapPointerStartOptions) => {
    if (!nodeId) {
        return false;
    }

    if (
        handleMandalaSwapNodeClick(swapState, nodeId, (source, target) =>
            executeMandalaSwap(view, source, target),
        )
    ) {
        event.preventDefault();
        event.stopPropagation();
        return true;
    }

    return false;
};

export const shouldBlockSwapDoubleClick = (
    swapState: Pick<MandalaSwapInteractionState, 'active'>,
) => shouldBlockMandalaNodeDoubleClickForSwap(swapState);

export const isSwapSourceNode = (
    swapState: MandalaSwapInteractionState,
    nodeId: string,
) => swapState.active && swapState.sourceNodeId === nodeId;

export const isSwapTargetNode = (
    swapState: MandalaSwapInteractionState,
    nodeId: string,
) => swapState.active && swapState.targetNodeIds.has(nodeId);

export const isSwapDisabledNode = (
    swapState: MandalaSwapInteractionState,
    nodeId: string,
) =>
    swapState.active &&
    !swapState.targetNodeIds.has(nodeId) &&
    swapState.sourceNodeId !== nodeId;
