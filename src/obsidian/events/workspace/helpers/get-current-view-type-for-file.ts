import { TFile, WorkspaceLeaf } from 'obsidian';
import MandalaGrid from 'src/main';
import { MANDALA_VIEW_TYPE } from 'src/view/view';
import { getLeafOfFile } from 'src/obsidian/events/workspace/helpers/get-leaf-of-file';

export const getCurrentViewTypeForFile = (
    plugin: MandalaGrid,
    file: TFile,
    leaf: WorkspaceLeaf | undefined,
) => {
    const leafFilePath = (leaf?.view as { file?: TFile })?.file?.path;
    if (leaf && leafFilePath === file.path) {
        return leaf.view.getViewType();
    }

    const persistedViewType = plugin.settings.getValue().documents[file.path]?.viewType;
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

