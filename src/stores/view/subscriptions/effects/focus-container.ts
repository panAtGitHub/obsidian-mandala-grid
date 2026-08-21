import { MandalaView } from 'src/view/view';
import { isMandalaEditing } from 'src/view/helpers/editor-focus-state';

export const focusContainer = (view: MandalaView) => {
    const container = view.container;
    if (!view.isActive || !container || isMandalaEditing(view)) return;

    window.requestAnimationFrame(() => {
        if (view.container !== container || isMandalaEditing(view)) return;
        container.focus();
    });
};
