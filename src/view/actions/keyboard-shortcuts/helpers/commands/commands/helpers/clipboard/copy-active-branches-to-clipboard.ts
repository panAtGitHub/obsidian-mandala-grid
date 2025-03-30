import { getDocumentFormat } from 'src/obsidian/events/workspace/helpers/get-document-format';
import { mapBranchesToText } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/map-branches-to-text';
import { LineageView } from 'src/view/view';
import { getActiveNodes } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/get-active-nodes';

export const copyActiveBranchesToClipboard = async (
    view: LineageView,
    formatted: boolean,
    isInSidebar: boolean,
) => {
    const nodes = getActiveNodes(view, isInSidebar);
    const text = mapBranchesToText(
        view.documentStore.getValue().document,
        nodes,
        formatted ? getDocumentFormat(view) : 'unformatted-text',
    );
    await navigator.clipboard.writeText(text);
};
