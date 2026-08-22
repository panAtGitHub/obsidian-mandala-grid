import { MandalaView } from 'src/view/view';
import { Platform } from 'obsidian';

export const focusContainer = (view: MandalaView) => {
    window.setTimeout(() => {
        if (!view.container) return;
        const isEditing = Boolean(view.inlineEditor.nodeId);
        const isEditingOnMobile = Platform.isMobile && isEditing;
        if (isEditingOnMobile) return;
        if (isEditing) view.inlineEditor.focus();
        else view.container.focus();
    }, 16);
};
