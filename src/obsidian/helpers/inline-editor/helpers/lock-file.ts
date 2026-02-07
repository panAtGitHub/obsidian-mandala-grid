import { MandalaView } from 'src/view/view';
import { MarkdownView } from 'obsidian';

const noop = async () => {};
export const lockFile = (view: MandalaView) => {
    view.plugin.app.workspace.iterateAllLeaves((e) => {
        const leafView = e.view;
        if (leafView instanceof MarkdownView) {
            if (leafView.file === view.file) {
                const patchedView = leafView as MarkdownView & {
                    mandalaSetViewData?: MarkdownView['setViewData'];
                };
                patchedView.mandalaSetViewData = leafView.setViewData;
                leafView.setViewData = noop;
            }
        }
    });
};
