import { traverseDown } from 'src/lib/tree-utils/get/traverse-down';
import { getView } from 'src/view/components/container/context';

export const DND_ACTIVE_CLASS = 'is-dragged';

const toggleDraggedNodeVisibility = (
    node: HTMLElement,
    data: DraggableData,
    visible: boolean,
) => {
    requestAnimationFrame(() => {
        const parent = node.matchParent('#' + data.id) as HTMLElement;
        if (parent) {
            parent.style.display = visible ? 'flex' : 'none';
            /* used to find the right most non-empty column*/
            parent.toggleClass(DND_ACTIVE_CLASS, !visible);
        }
    });
};

export type DraggableData = {
    id: string;
    isInSidebar: boolean;
};

export const draggable = (node: HTMLElement, data: DraggableData) => {
    const view = getView();
    const viewStore = view.viewStore;
    const documentStore = view.documentStore;
    if (data.isInSidebar) return;
    node.draggable = true;

    const handleDragstart = (event: DragEvent) => {
        if (!event.dataTransfer) return;
        const target = event.currentTarget as HTMLElement;
        if (
            event.clientX - target.getBoundingClientRect().x <= 7 ||
            target.dataset['test'] === 'true'
        ) {
            event.dataTransfer.setData('text/plain', data.id);
            setTimeout(() => {
                const childGroups = traverseDown(
                    documentStore.getValue().document.columns,
                    data.id,
                    false,
                );
                viewStore.dispatch({
                    type: 'view/dnd/set-drag-started',
                    payload: { nodeId: data.id, childGroups },
                });
                toggleDraggedNodeVisibility(node, data, false);
            }, 0);
        } else {
            event.preventDefault();
        }
    };

    node.addEventListener('dragstart', handleDragstart);
    const handleDragEnd = () => {
        viewStore.dispatch({ type: 'view/dnd/set-drag-ended' });
        toggleDraggedNodeVisibility(node, data, true);
    };
    node.addEventListener('dragend', handleDragEnd);

    return {
        destroy: () => {
            node.removeEventListener('dragstart', handleDragstart);
            node.removeEventListener('dragend', handleDragEnd);
        },
    };
};
