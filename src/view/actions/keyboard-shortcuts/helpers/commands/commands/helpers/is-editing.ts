import { isMandalaEditing } from 'src/view/helpers/editor-focus-state';
import type { MandalaView } from 'src/view/view';

export const isEditing = isMandalaEditing;
export const isActive = (view: MandalaView) => {
    return !!view.viewStore.getValue().document.activeNode;
};
export const isNotEditing = (view: MandalaView) => {
    return !isEditing(view);
};
