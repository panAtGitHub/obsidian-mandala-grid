import Lineage from 'src/main';
import { TFile } from 'obsidian';
import { LineageDocumentFormat } from 'src/stores/settings/settings-type';
import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';

import { setDocumentFormat } from 'src/stores/settings/actions/set-document-format';

export const openFileInLineage = async (
    plugin: Lineage,
    file: TFile,
    type: LineageDocumentFormat,
    newLeaf: 'split' | 'tab',
) => {
    const leaf = await openFile(plugin, file, newLeaf);
    toggleObsidianViewType(plugin, leaf, 'lineage');
    setDocumentFormat(plugin, file.path, type);
};
