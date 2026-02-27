import { VerticalDirection } from 'src/stores/document/document-store-actions';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { MandalaView } from 'src/view/view';
import { lang } from 'src/lang/lang';

export const mergeNode = (view: MandalaView, direction: VerticalDirection) => {
    void direction;
    saveNodeContent(view);
    if (view.viewStore.getValue().document.selectedNodes.size > 1) {
        throw new Error(lang.error_hk_cant_merge_multiple_nodes);
    }
};
