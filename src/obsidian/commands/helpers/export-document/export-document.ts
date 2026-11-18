import { createNewFile } from 'src/obsidian/events/workspace/effects/create-new-file';
import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
import { onPluginError } from 'src/shared/store/on-plugin-error';
import { mapDocumentToText } from 'src/obsidian/commands/helpers/export-document/map-document-to-text';
import { MandalaView } from 'src/view/view';

export const exportDocument = async (view: MandalaView) => {
    try {
        const file = view.file;
        if (!file) return;
        if (!file.parent) return;

        await view.flushPendingSaves();
        const fileData = await view.plugin.app.vault.read(file);
        const output = mapDocumentToText(fileData);
        const newFile = await createNewFile(
            view.plugin,
            file.parent,
            output,
            file.basename,
        );
        if (newFile) {
            await openFile(view.plugin, newFile, 'split');
        }
    } catch (e) {
        onPluginError(e, 'command', { type: 'export-document' });
    }
};
