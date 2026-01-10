import Lineage from 'src/main';
import { TFile, WorkspaceLeaf } from 'obsidian';
import { getLeafOfFile } from 'src/obsidian/events/workspace/helpers/get-leaf-of-file';
import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';
import { LINEAGE_VIEW_TYPE } from 'src/view/view';

import { setViewType } from 'src/stores/settings/actions/set-view-type';

export const toggleFileViewType = async (
    plugin: Lineage,
    file: TFile,
    leaf: WorkspaceLeaf | undefined,
) => {
    const documents = plugin.settings.getValue().documents;
    const preferences = documents[file.path] ? documents[file.path] : null;

    const currentViewType = preferences ? preferences.viewType : 'markdown';

    let fileLeaf = leaf || getLeafOfFile(plugin, file, currentViewType);
    if (!fileLeaf) fileLeaf = await openFile(plugin, file, 'tab');

    const newViewType =
        currentViewType === 'markdown' ? LINEAGE_VIEW_TYPE : 'markdown';
    toggleObsidianViewType(plugin, fileLeaf, newViewType);
    setViewType(plugin, file.path, newViewType);
};
