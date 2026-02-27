import { AllDirections } from 'src/stores/document/document-store-actions';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { MandalaView } from 'src/view/view';

export const moveNode = (view: MandalaView, direction: AllDirections) => {
    void direction;
    saveNodeContent(view);
};
