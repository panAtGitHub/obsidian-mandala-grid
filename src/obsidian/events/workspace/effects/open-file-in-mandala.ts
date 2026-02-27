import MandalaGrid from 'src/main';
import { TFile } from 'obsidian';
import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';
import { MANDALA_VIEW_TYPE } from 'src/view/view';

export const openFileInMandalaGrid = async (
    plugin: MandalaGrid,
    file: TFile,
    newLeaf: 'split' | 'tab',
) => {
    const leaf = await openFile(plugin, file, newLeaf);
    toggleObsidianViewType(plugin, leaf, MANDALA_VIEW_TYPE);
};
