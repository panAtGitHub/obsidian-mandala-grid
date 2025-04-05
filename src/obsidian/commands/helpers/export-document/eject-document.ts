import { onPluginError } from 'src/lib/store/on-plugin-error';
import { mapDocumentToText } from 'src/obsidian/commands/helpers/export-document/map-document-to-text';
import { getDocumentFormat } from 'src/obsidian/events/workspace/helpers/get-document-format';
import { LineageView } from 'src/view/view';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { setViewType } from 'src/obsidian/events/workspace/actions/set-view-type';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';

export const ejectDocument = async (view: LineageView) => {
    try {
        const file = view.file;
        if (!file) return;
        if (!file.parent) return;

        const viewState = view.viewStore.getValue();
        const isEditing = Boolean(viewState.document.editing.activeNodeId);
        if (isEditing) {
            saveNodeContent(view);
            setTimeout(() => {
                ejectDocument(view);
            }, 100);
            return;
        }
        const fileData = await view.plugin.app.vault.read(file);
        const format = getDocumentFormat(view);
        const text = mapDocumentToText(fileData, format);
        await view.plugin.app.vault.modify(file, text);
        toggleObsidianViewType(view.plugin, view.leaf, 'markdown');
        setViewType(view.plugin, file.path, 'markdown');
    } catch (e) {
        onPluginError(e, 'command', { type: 'export-document' });
    }
};
