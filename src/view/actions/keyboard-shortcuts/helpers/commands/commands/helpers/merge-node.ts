import { VerticalDirection } from 'src/stores/document/document-store-actions';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { LineageView } from 'src/view/view';
import { lang } from 'src/lang/lang';

export const mergeNode = (view: LineageView, direction: VerticalDirection) => {
    saveNodeContent(view);
    if (view.viewStore.getValue().document.selectedNodes.size > 1) {
        throw new Error(lang.error_hk_cant_merge_multiple_nodes);
    }
    view.documentStore.dispatch({
        type: 'document/merge-node',
        payload: {
            direction,
            activeNodeId: view.viewStore.getValue().document.activeNode,
        },
    });
};
