import { Menu, TFile, WorkspaceLeaf } from 'obsidian';
import Lineage from 'src/main';
import { LINEAGE_VIEW_TYPE } from 'src/view/view';
import { lang } from 'src/lang/lang';
import { customIcons } from 'src/helpers/load-custom-icons';
import { toggleFileViewType } from 'src/obsidian/events/workspace/effects/toggle-file-view-type';
import { getLeafOfFile } from 'src/obsidian/events/workspace/helpers/get-leaf-of-file';

export const addToggleViewMenuItem = (
    menu: Menu,
    plugin: Lineage,
    file: TFile,
    leaf: WorkspaceLeaf | undefined,
) => {
    if (file.extension !== 'md') return;
    menu.addItem((item) => {
        if (!leaf) {
            leaf = getLeafOfFile(plugin, file, LINEAGE_VIEW_TYPE);
        }
        const isTree = leaf && leaf.view.getViewType() === LINEAGE_VIEW_TYPE;
        item.setTitle(
            isTree ? lang.ocm_open_in_editor : lang.ocm_open_in_lineage,
        );
        item.setIcon(isTree ? 'file-text' : customIcons.cards.name);

        item.onClick(async () => {
            toggleFileViewType(plugin, file, leaf);
        });
    });
};
