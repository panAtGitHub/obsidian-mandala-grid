import { MandalaView } from 'src/view/view';
import {
    MenuItemObject,
    renderContextMenu,
} from 'src/obsidian/context-menu/render-context-menu';
import { selectInactiveCard } from 'src/obsidian/context-menu/select-inactive-card';
import { textIsSelected } from 'src/view/actions/context-menu/card-context-menu/helpers/text-is-selected';
import { createMultipleNodesContextMenu } from 'src/view/actions/context-menu/card-context-menu/create-multiple-nodes-context-menu';
import { createPinnedListContextMenuItems } from 'src/view/actions/context-menu/card-context-menu/create-pinned-list-context-menu-items';
import { createSidebarContextMenuItems } from 'src/view/actions/context-menu/card-context-menu/create-sidebar-context-menu-items';
import { createSingleNodeContextMenuItems } from 'src/view/actions/context-menu/card-context-menu/create-single-node-context-menu-items';
import { touchEventToMouseEvent } from 'src/obsidian/context-menu/touch-event-to-mouse-event';

const getContextMenuContext = (
    view: MandalaView,
    isInSidebar: boolean,
    activeNode: string,
) => {
    const viewState = view.viewStore.getValue();
    const multipleNodesAreSelected =
        !isInSidebar && viewState.document.selectedNodes.size > 1;
    const documentStore = view.documentStore;
    const documentState = documentStore.getValue();
    const isPinned =
        isInSidebar ||
        documentState.pinnedNodes.Ids.includes(activeNode);

    const hasChildren = documentState.meta.groupParentIds.has(activeNode);
    return {
        activeNode,
        isPinned,
        isInSidebar,
        multipleNodesAreSelected,
        hasChildren,
    };
};

export const showNodeContextMenu = (
    event: MouseEvent | TouchEvent,
    view: MandalaView,
) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const closestCardElement = target.closest(
        '.mandala-card, .simple-cell, .pinned-list-item',
    );
    if (!(closestCardElement instanceof HTMLElement)) return;

    if (!closestCardElement || !closestCardElement.id) return;

    if (textIsSelected()) return;

    const isInSidebar = Boolean(target.closest('.sidebar'));
    const isPinnedListItem = closestCardElement.hasClass('pinned-list-item');
    const targetNodeId = closestCardElement.id;

    const targetIsActive = isPinnedListItem
        ? closestCardElement.hasClass('selected')
        : closestCardElement.hasClass('active-node');
    if (!targetIsActive) {
        selectInactiveCard(view, closestCardElement, isInSidebar);
    }

    const context = getContextMenuContext(view, isInSidebar, targetNodeId);
    let menuItems: MenuItemObject[];
    if (isPinnedListItem) {
        menuItems = createPinnedListContextMenuItems(view, {
            activeNode: targetNodeId,
            section:
                view.documentStore.getValue().sections.id_section[targetNodeId],
        });
    } else if (context.isInSidebar) {
        menuItems = createSidebarContextMenuItems(view, context);
    } else if (context.multipleNodesAreSelected) {
        menuItems = createMultipleNodesContextMenu(view);
    } else {
        menuItems = createSingleNodeContextMenuItems(view, context);
    }
    const contextEvent = event.instanceOf(MouseEvent)
        ? event
        : touchEventToMouseEvent(event);
    if (!contextEvent) return;
    renderContextMenu(contextEvent, menuItems);
};
