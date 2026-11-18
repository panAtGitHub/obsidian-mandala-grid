import type { PinnedNodes } from 'src/stores/view/view-state-type';

export type SetActivePinnedNodeAction = {
    type: 'view/pinned-nodes/set-active-node';
    payload: {
        id: string;
    };
};

export const setActivePinnedNode = (state: PinnedNodes, id: string) => {
    state.activeNode = id;
};
