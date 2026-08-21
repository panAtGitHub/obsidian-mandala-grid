import type { MandalaView } from 'src/view/view';

export const isMandalaEditing = (view: MandalaView) =>
    Boolean(view.viewStore.getValue().document.editing.activeNodeId);
