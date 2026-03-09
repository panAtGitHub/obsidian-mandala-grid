import { onPluginError } from 'src/lib/store/on-plugin-error';
import { mapDocumentToText } from 'src/obsidian/commands/helpers/export-document/map-document-to-text';
import { MandalaView } from 'src/view/view';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { setViewType } from 'src/stores/settings/actions/set-view-type';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';

export const ejectDocument = async (view: MandalaView) => {
    try {
        const file = view.file;
        if (!file) return;
        if (!file.parent) return;

        const viewState = view.viewStore.getValue();
        const isEditing = Boolean(viewState.document.editing.activeNodeId);
        if (isEditing) {
            saveNodeContent(view);
            setTimeout(() => {
                void ejectDocument(view);
            }, 100);
            return;
        }
        const fileData = await view.plugin.app.vault.read(file);
        const text = mapDocumentToText(fileData);
        await view.plugin.app.vault.modify(file, text);
        toggleObsidianViewType(view.plugin, view.leaf, 'markdown');
        setViewType(view.plugin, file.path, 'markdown');
    } catch (e) {
        onPluginError(e, 'command', { type: 'export-document' });
    }
};
