import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { MandalaView } from 'src/view/view';
import { SplitNodeMode } from 'src/stores/document/reducers/split-node/split-node';

export const splitNode = (view: MandalaView, mode: SplitNodeMode) => {
    void mode;
    saveNodeContent(view);
};
