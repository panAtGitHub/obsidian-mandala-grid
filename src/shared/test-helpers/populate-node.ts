import { MandalaView } from 'src/view/view';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';

export const __populateNode__ = (view: MandalaView, nodeId: string) => {
    view.inlineEditor.setContent(
        view.documentStore.getValue().sections.id_section[nodeId],
    );
    saveNodeContent(view);
};
