import { AllDirections } from 'src/stores/document/document-store-actions';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';

import { isEditing } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/is-editing';
import { MandalaView } from 'src/view/view';

export const saveNodeAndInsertNode = (
    view: MandalaView,
    direction: AllDirections,
    content = '',
    activeNodeId?: string,
) => {
    if (isEditing(view)) {
        saveNodeContent(view);
    }
    const nodeId =
        activeNodeId || view.viewStore.getValue().document.activeNode;
    if (view.documentStore.getValue().meta.isMandala) return;
    view.documentStore.dispatch({
        type: 'document/add-node',
        payload: {
            position: direction,
            content,
            activeNodeId: nodeId,
        },
    });
    if (content) {
        const newNodeId = view.viewStore.getValue().document.activeNode;
        if (direction === 'down' || direction === 'right') {
            view.inlineEditor.setNodeCursor(newNodeId, { line: 0, ch: 0 });
        }
    }
};
