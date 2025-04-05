import { LineageView } from 'src/view/view';
import { MenuItemObject } from 'src/obsidian/context-menu/render-context-menu';
import { lang } from 'src/lang/lang';
import { copyActiveBranchesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-active-branches-to-clipboard';
import { copyActiveNodesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-active-nodes-to-clipboard';
import { cutNode } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/cut-node';
import { pasteNode } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/paste-node';
import { exportSelection } from 'src/view/actions/context-menu/card-context-menu/helpers/export-selection';

export const createMultipleNodesContextMenu = (view: LineageView) => {
    const menuItems: MenuItemObject[] = [
        {
            title: lang.cm_copy,
            icon: 'documents',
            submenu: [
                {
                    title: lang.cm_copy_branches,
                    icon: 'lineage-cards',
                    action: () =>
                        copyActiveBranchesToClipboard(view, true, false),
                },
                {
                    title: lang.cm_copy_branches_wo_formatting,
                    icon: 'file-text',
                    action: () =>
                        copyActiveBranchesToClipboard(view, false, false),
                },
                {
                    title: lang.cm_copy_section_wo_subitems,
                    icon: 'file-text',
                    action: () => copyActiveNodesToClipboard(view, false),
                },
            ],
        },
        {
            title: lang.cm_cut,
            icon: 'scissors',
            action: () => cutNode(view),
        },
        {
            title: lang.cm_paste,
            icon: 'paste',
            action: () => pasteNode(view),
        },
        { type: 'separator' },
        {
            title: lang.cm_export_selection,
            icon: 'file-text',
            submenu: [
                {
                    title: lang.cmd_export_branches_with_subitems,
                    icon: 'file-text',
                    action: () => exportSelection(view, true),
                },
                {
                    title: lang.cmd_export_sections_wo_subitems,
                    icon: 'file-text',
                    action: () => exportSelection(view, false),
                },
            ],
        },
    ];
    return menuItems;
};
