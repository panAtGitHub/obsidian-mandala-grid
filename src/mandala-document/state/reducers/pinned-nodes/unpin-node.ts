import { PinnedNodesState } from 'src/mandala-document/state/document-state-type';

export type UnpinNodeAction = {
    type: 'document/pinned-nodes/unpin';
    payload: {
        id: string;
    };
};

export const unpinNode = (pinnedNodes: PinnedNodesState, id: string) => {
    pinnedNodes.Ids = pinnedNodes.Ids.filter((_id) => _id !== id);
};
