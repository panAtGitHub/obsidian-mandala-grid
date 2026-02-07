import { MandalaView } from 'src/view/view';
import { MarkdownView } from 'obsidian';

export const unlockFile = (view: MandalaView) => {
    view.plugin.app.workspace.iterateAllLeaves((e) => {
        const leafView = e.view;
        if (leafView instanceof MarkdownView) {
            if (leafView.file === view.file) {
                const patchedView = leafView as MarkdownView & {
                    mandalaSetViewData?: MarkdownView['setViewData'];
                };
                if (patchedView.mandalaSetViewData) {
                    leafView.setViewData = patchedView.mandalaSetViewData;
                    delete patchedView.mandalaSetViewData;
                }
            }
        }
    });
};
