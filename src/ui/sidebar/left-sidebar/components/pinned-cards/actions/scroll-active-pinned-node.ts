import { ActivePinnedCardStore } from 'src/stores/view/derived/pinned-cards-sidebar';
import { scrollCardIntoView } from '../../recent-cards/helpers/scroll-card-into-view';
import { PinnedNodesStore } from 'src/stores/cell/document-derived-stores';
import { getView } from 'src/views/shared/shell/context';

export const scrollActivePinnedNode = (containerRef: HTMLElement) => {
    const view = getView();
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const activePinnedCardStore = ActivePinnedCardStore(view);
    const activePinnedNodeSub = activePinnedCardStore.subscribe(
        (activeNodeId) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (!containerRef) return;
                if (!activeNodeId) return;
                scrollCardIntoView(containerRef, activeNodeId);
            }, 200);
        },
    );

    const pinnedNodesStore = PinnedNodesStore(view);
    const pinnedNodesSub = pinnedNodesStore.subscribe(() => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (!containerRef) return;
            const activeNodeId =
                view.viewStore.getValue().pinnedNodes.activeNode;
            if (!activeNodeId) return;
            scrollCardIntoView(containerRef, activeNodeId);
        }, 200);
    });

    return {
        destroy: () => {
            activePinnedNodeSub();
            pinnedNodesSub();
        },
    };
};
