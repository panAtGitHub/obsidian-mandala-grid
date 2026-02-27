import { MandalaView } from 'src/view/view';
import { copyActiveBranchesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-active-branches-to-clipboard';

export const cutNode = async (view: MandalaView) => {
    const documentState = view.documentStore.getValue();
    const document = view.viewStore.getValue().document;
    await copyActiveBranchesToClipboard(view, true, false);
    if (documentState.meta.isMandala) return;
    view.documentStore.dispatch({
        type: 'document/cut-node',
        payload: {
            nodeId: document.activeNode,
            selectedNodes: document.selectedNodes,
        },
    });
};
