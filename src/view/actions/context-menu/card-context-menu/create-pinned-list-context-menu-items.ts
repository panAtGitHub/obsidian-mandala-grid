import { MandalaView } from 'src/view/view';
import { MenuItemObject } from 'src/obsidian/context-menu/render-context-menu';
import {
    createCopyHeadingLinkEmbedDollarMenuItems,
    createPinToggleMenuItems,
    createSectionColorMenuItems,
} from 'src/view/actions/context-menu/card-context-menu/create-shared-menu-items';

type Props = {
    activeNode: string;
    section: string | undefined;
};

export const createPinnedListContextMenuItems = (
    view: MandalaView,
    { activeNode, section }: Props,
) => {
    const menuItems: MenuItemObject[] = [];
    const copyHeadingItems = createCopyHeadingLinkEmbedDollarMenuItems(
        view,
        activeNode,
    );

    if (copyHeadingItems.length) {
        menuItems.push(...copyHeadingItems, { type: 'separator' });
    }

    menuItems.push(
        ...createPinToggleMenuItems(view, activeNode, true, true),
        { type: 'separator' },
        ...createSectionColorMenuItems(view, section),
    );

    return menuItems;
};
