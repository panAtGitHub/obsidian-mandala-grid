import { MandalaView } from 'src/view/view';
import { getBranch } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/get-branch';
import { branchToHtmlComment } from 'src/lib/data-conversion/branch-to-x/branch-to-html-comment';
import { createNewFile } from 'src/obsidian/events/workspace/effects/create-new-file';
import invariant from 'tiny-invariant';
import { openFileInMandalaGrid } from 'src/obsidian/events/workspace/effects/open-file-in-mandala';
import { getFileNameOfExtractedBranch } from 'src/obsidian/commands/helpers/extract-branch/helpers/get-file-name-of-extracted-branch/get-file-name-of-extracted-branch';
import { onPluginError } from 'src/lib/store/on-plugin-error';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';

export const extractBranch = async (view: MandalaView) => {
    try {
        invariant(view.file);
        invariant(view.file.parent);
        const viewState = view.viewStore.getValue();

        const isEditing = Boolean(viewState.document.editing.activeNodeId);
        if (isEditing) {
            saveNodeContent(view);
            setTimeout(() => {
                void extractBranch(view);
            }, 100);
            return;
        }

        const documentState = view.documentStore.getValue();
        const branch = getBranch(
            documentState.document.columns,
            documentState.document.content,
            viewState.document.activeNode,
            'copy',
        );

        const text = branchToHtmlComment([branch]);
        const fileName = getFileNameOfExtractedBranch(
            branch.content[branch.nodeId].content,
            view.file.basename,
            documentState.sections.id_section[branch.nodeId],
        );
        const newFile = await createNewFile(
            view.plugin,
            view.file.parent,
            text,
            fileName,
        );
        await openFileInMandalaGrid(view.plugin, newFile, 'split');
    } catch (e) {
        onPluginError(e, 'command', { type: 'extract-branch' });
    }
};
