import { LineageView } from 'src/view/view';
import { getActiveNodes } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/get-active-nodes';
import { copyNodesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-nodes-to-clipboard';

export const copyActiveNodesToClipboard = async (
    view: LineageView,
    isInSidebar: boolean,
) => {
    const nodes = getActiveNodes(view, isInSidebar);
    await copyNodesToClipboard(view, nodes);
};
