import { Menu, TFile, WorkspaceLeaf } from 'obsidian';
import MandalaGrid from 'src/main';
import { MANDALA_VIEW_TYPE } from 'src/view/view';
import { lang } from 'src/lang/lang';
import { customIcons } from 'src/helpers/load-custom-icons';
import { toggleFileViewType } from 'src/obsidian/events/workspace/effects/toggle-file-view-type';
import { getLeafOfFile } from 'src/obsidian/events/workspace/helpers/get-leaf-of-file';

const getCurrentViewType = (
    plugin: MandalaGrid,
    file: TFile,
    leaf: WorkspaceLeaf | undefined,
) => {
    const leafFilePath = (leaf?.view as { file?: TFile })?.file?.path;
    if (leaf && leafFilePath === file.path) {
        return leaf.view.getViewType();
    }

    const persistedViewType =
        plugin.settings.getValue().documents[file.path]?.viewType;
    if (persistedViewType === 'markdown') {
        return 'markdown';
    }
    if (persistedViewType === MANDALA_VIEW_TYPE) {
        return MANDALA_VIEW_TYPE;
    }

    if (getLeafOfFile(plugin, file, 'markdown')) {
        return 'markdown';
    }
    if (getLeafOfFile(plugin, file, MANDALA_VIEW_TYPE)) {
        return MANDALA_VIEW_TYPE;
    }

    return 'markdown';
};

export const addToggleViewMenuItem = (
    menu: Menu,
    plugin: MandalaGrid,
    file: TFile,
    leaf: WorkspaceLeaf | undefined,
) => {
    if (file.extension !== 'md') return;
    menu.addItem((item) => {
        const currentViewType = getCurrentViewType(plugin, file, leaf);
        const isTree = currentViewType === MANDALA_VIEW_TYPE;
        item.setTitle(
            isTree ? lang.ocm_open_in_editor : lang.ocm_open_in_mandala,
        );
        item.setIcon(isTree ? 'file-text' : customIcons.mandalaGrid.name);

        item.onClick(() => {
            const targetLeaf =
                leaf ||
                getLeafOfFile(
                    plugin,
                    file,
                    currentViewType === 'markdown'
                        ? 'markdown'
                        : MANDALA_VIEW_TYPE,
                );
            void toggleFileViewType(plugin, file, targetLeaf);
        });
    });
};
