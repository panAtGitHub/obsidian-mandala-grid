import { PinnedNodesState } from 'src/mandala-document/state/document-state-type';

const replacePinnedNodeId = (
    pinnedNodeIds: string[],
    fromId: string,
    toId: string,
) => pinnedNodeIds.map((id) => (id === fromId ? toId : id));

export const swapPinnedNodeState = (
    pinnedNodes: PinnedNodesState,
    sourceNodeId: string,
    targetNodeId: string,
) => {
    if (sourceNodeId === targetNodeId) return;
    const sourcePinned = pinnedNodes.Ids.includes(sourceNodeId);
    const targetPinned = pinnedNodes.Ids.includes(targetNodeId);
    if (sourcePinned === targetPinned) return;

    if (sourcePinned) {
        pinnedNodes.Ids = replacePinnedNodeId(
            pinnedNodes.Ids,
            sourceNodeId,
            targetNodeId,
        );
        return;
    }

    pinnedNodes.Ids = replacePinnedNodeId(
        pinnedNodes.Ids,
        targetNodeId,
        sourceNodeId,
    );
};
