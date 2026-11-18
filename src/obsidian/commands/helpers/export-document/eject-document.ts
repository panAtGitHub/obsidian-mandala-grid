import { onPluginError } from 'src/shared/store/on-plugin-error';
import { mapDocumentToText } from 'src/obsidian/commands/helpers/export-document/map-document-to-text';
import { MandalaView } from 'src/view/view';
import { setViewType } from 'src/mandala-settings/state/actions/set-view-type';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';

export const ejectDocument = async (view: MandalaView) => {
    try {
        const file = view.file;
        if (!file) return;
        if (!file.parent) return;

        await view.flushPendingSaves();
        await view.plugin.app.vault.process(file, (fileData) =>
            mapDocumentToText(fileData),
        );
        toggleObsidianViewType(view.plugin, view.leaf, 'markdown');
        setViewType(view.plugin, file.path, 'markdown');
    } catch (e) {
        onPluginError(e, 'command', { type: 'export-document' });
    }
};
