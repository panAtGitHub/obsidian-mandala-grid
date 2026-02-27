import { MandalaView } from 'src/view/view';
import { createNewFile } from 'src/obsidian/events/workspace/effects/create-new-file';
import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { getTextOfFlatNodes } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/get-text-of-flat-nodes';
import { getActiveNodes } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/get-active-nodes';
import { mapBranchesToText } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/map-branches-to-text';

export const exportSelection = async (
    view: MandalaView,
    includeSubItems: boolean,
) => {
    const viewState = view.viewStore.getValue();

    const isEditing = Boolean(viewState.document.editing.activeNodeId);
    if (isEditing) {
        saveNodeContent(view);
        setTimeout(() => {
            void exportSelection(view, includeSubItems);
        }, 100);
        return;
    }

    let text = '';

    const nodes = getActiveNodes(view, false);
    if (includeSubItems) {
        const documentState = view.documentStore.getValue();
        text = mapBranchesToText(
            documentState.document,
            documentState.sections,
            nodes,
            'unformatted-text',
        );
    } else {
        text = getTextOfFlatNodes(view, nodes, false);
    }

    const file = view.file!;
    const newFile = await createNewFile(
        view.plugin,
        file.parent!,
        text,
        `${file.basename} - exported selection`,
    );
    await openFile(view.plugin, newFile, 'split');
};
