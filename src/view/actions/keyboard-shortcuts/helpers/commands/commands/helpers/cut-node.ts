import { LineageView } from 'src/view/view';
import { copyActiveBranchesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-active-branches-to-clipboard';

export const cutNode = async (view: LineageView) => {
    const document = view.viewStore.getValue().document;
    await copyActiveBranchesToClipboard(view, true, false);
    view.documentStore.dispatch({
        type: 'document/cut-node',
        payload: {
            nodeId: document.activeNode,
            selectedNodes: document.selectedNodes,
        },
    });
};
