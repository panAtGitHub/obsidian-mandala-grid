import { MandalaView } from 'src/view/view';
import { MenuItemObject } from 'src/obsidian/context-menu/render-context-menu';
import { lang } from 'src/lang/lang';
import { copyLinkToBlock } from 'src/view/actions/context-menu/card-context-menu/helpers/copy-link-to-block';
import { copyLinkToHeading } from 'src/view/actions/context-menu/card-context-menu/helpers/copy-link-to-heading';
import { createCoreJumpMenuItems } from 'src/view/actions/context-menu/helpers/create-core-jump-menu-items';
import { startMandalaSwap } from 'src/view/helpers/mandala/mandala-swap';
import { resolveContextMenuCopyLinkVisibility } from 'src/mandala-settings/state/helpers/context-menu-copy-link-visibility';
import {
    createPinToggleMenuItems,
    createSectionColorMenuItems,
} from 'src/view/actions/context-menu/card-context-menu/create-shared-menu-items';

type Props = {
    activeNode: string;
    isPinned: boolean;
};
export const createSingleNodeContextMenuItems = (
    view: MandalaView,
    { isPinned, activeNode }: Props,
) => {
    const isMandala = view.documentStore.getValue().meta.isMandala;
    const section =
        view.documentStore.getValue().sections.id_section[activeNode];

    const menuItems: MenuItemObject[] = [];
    if (isMandala) {
        menuItems.push({
            title: lang.cm_swap_position,
            icon: 'shuffle',
            action: () => startMandalaSwap(view, activeNode),
        });
    }
    const coreJumpItems = createCoreJumpMenuItems(view);
    if (coreJumpItems.length) {
        if (menuItems.length) {
            menuItems.push({ type: 'separator' });
        }
        menuItems.push(...coreJumpItems);
        menuItems.push({ type: 'separator' });
    }
    const copyLinkVisibility = resolveContextMenuCopyLinkVisibility(
        view.plugin.settings.getValue().view,
    );
    const copyLinkItems: MenuItemObject[] = [];
    if (copyLinkVisibility['block-plain']) {
        copyLinkItems.push({
            title: lang.cm_copy_link_to_block,
            icon: 'links-coming-in',
            action: () => {
                void copyLinkToBlock(view, false, { embed: false });
            },
        });
    }
    if (copyLinkVisibility['block-embed']) {
        copyLinkItems.push({
            title: lang.cm_copy_link_to_block_embed,
            icon: 'links-coming-in',
            action: () => {
                void copyLinkToBlock(view, false, { embed: true });
            },
        });
    }
    if (copyLinkVisibility['heading-plain']) {
        copyLinkItems.push({
            title: lang.cm_copy_heading_link,
            icon: 'heading-1',
            action: () => {
                void copyLinkToHeading(view, activeNode, { embed: false });
            },
        });
    }
    if (copyLinkVisibility['heading-embed']) {
        copyLinkItems.push({
            title: lang.cm_copy_heading_link_embed,
            icon: 'heading-1',
            action: () => {
                void copyLinkToHeading(view, activeNode, { embed: true });
            },
        });
    }
    if (copyLinkVisibility['heading-embed-dollar']) {
        copyLinkItems.push({
            title: lang.cm_copy_heading_link_embed_dollar,
            icon: 'heading-1',
            action: () => {
                void copyLinkToHeading(view, activeNode, {
                    embed: true,
                    alias: '$',
                });
            },
        });
    }
    if (copyLinkItems.length > 0) {
        menuItems.push(...copyLinkItems, { type: 'separator' });
    }
    menuItems.push(
        ...createPinToggleMenuItems(view, activeNode, isPinned, false),
        { type: 'separator' },
        ...createSectionColorMenuItems(view, section),
    );
    return menuItems;
};
