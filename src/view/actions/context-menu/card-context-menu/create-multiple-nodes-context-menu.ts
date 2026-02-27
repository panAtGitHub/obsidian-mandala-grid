import { MandalaView } from 'src/view/view';
import { MenuItemObject } from 'src/obsidian/context-menu/render-context-menu';
import { lang } from 'src/lang/lang';
import { copyActiveBranchesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-active-branches-to-clipboard';
import { copyActiveNodesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-active-nodes-to-clipboard';
import { exportSelection } from 'src/view/actions/context-menu/card-context-menu/helpers/export-selection';

export const createMultipleNodesContextMenu = (view: MandalaView) => {
    const menuItems: MenuItemObject[] = [
        {
            title: lang.cm_copy,
            icon: 'documents',
            submenu: [
                {
                    title: lang.cm_copy_branches,
                    icon: 'mandala-cards',
                    action: () => {
                        void copyActiveBranchesToClipboard(view, true, false);
                    },
                },
                {
                    title: lang.cm_copy_branches_wo_formatting,
                    icon: 'file-text',
                    action: () => {
                        void copyActiveBranchesToClipboard(view, false, false);
                    },
                },
                {
                    title: lang.cm_copy_node_wo_subitems,
                    icon: 'file-text',
                    action: () => {
                        void copyActiveNodesToClipboard(view, false);
                    },
                },
            ],
        },
        {
            title: lang.cm_export_selection,
            icon: 'file-text',
            submenu: [
                {
                    title: lang.cmd_export_branches_with_subitems,
                    icon: 'file-text',
                    action: () => {
                        void exportSelection(view, true);
                    },
                },
                {
                    title: lang.cmd_export_nodes_wo_subitems,
                    icon: 'file-text',
                    action: () => {
                        void exportSelection(view, false);
                    },
                },
            ],
        },
    ];
    return menuItems;
};
