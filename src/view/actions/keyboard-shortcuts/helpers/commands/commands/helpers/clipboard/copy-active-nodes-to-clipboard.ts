import { LineageView } from 'src/view/view';
import { getActiveNodes } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/get-active-nodes';

export const copyActiveNodesToClipboard = async (
    view: LineageView,
    isInSidebar: boolean,
) => {
    const nodes = getActiveNodes(view, isInSidebar);
    const text = nodes
        .map((id) => view.documentStore.getValue().document.content[id].content)
        .join('\n\n');
    await navigator.clipboard.writeText(text);
};
