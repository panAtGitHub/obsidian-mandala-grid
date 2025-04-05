import { LineageView } from 'src/view/view';
import { MenuItemObject } from 'src/obsidian/context-menu/render-context-menu';
import { lang } from 'src/lang/lang';
import { copyLinkToBlock } from 'src/view/actions/context-menu/card-context-menu/helpers/copy-link-to-block';
import { copyActiveNodesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-active-nodes-to-clipboard';

export const togglePinNode = (
    view: LineageView,
    activeNode: string,
    isPinned: boolean,
    isInSidebar: boolean,
) => {
    const viewState = view.viewStore.getValue();
    const id = isInSidebar ? viewState.pinnedNodes.activeNode : activeNode;
    view.documentStore.dispatch({
        type: isPinned
            ? 'document/pinned-nodes/unpin'
            : 'document/pinned-nodes/pin',
        payload: { id: id },
    });
};

type Props = {
    activeNode: string;
    isPinned: boolean;
    isInRecentCardsList: boolean;
};
export const createSidebarContextMenuItems = (
    view: LineageView,
    { isPinned, activeNode, isInRecentCardsList }: Props,
) => {
    const menuItems: MenuItemObject[] = [
        {
            title: lang.cm_copy_link_to_block,
            icon: 'links-coming-in',
            action: () => copyLinkToBlock(view, true),
        },
        { type: 'separator' },
        {
            title: lang.cm_copy,
            icon: 'documents',
            action: () => copyActiveNodesToClipboard(view, true),
        },

        { type: 'separator' },
        {
            title: isPinned
                ? lang.cm_unpin_from_left_sidebar
                : lang.cm_pin_in_left_sidebar,
            icon: isPinned ? 'pin-off' : 'pin',
            action: () => togglePinNode(view, activeNode, isPinned, true),
            disabled: isInRecentCardsList,
        },
        { type: 'separator' },
    ];
    return menuItems;
};
