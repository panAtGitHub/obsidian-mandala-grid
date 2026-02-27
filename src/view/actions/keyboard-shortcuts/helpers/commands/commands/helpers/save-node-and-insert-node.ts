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
    void direction;
    void content;
    void activeNodeId;
    if (isEditing(view)) {
        saveNodeContent(view);
    }
};
