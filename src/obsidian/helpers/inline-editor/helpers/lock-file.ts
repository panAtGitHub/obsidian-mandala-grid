import { MandalaView } from 'src/view/view';
import { MarkdownView } from 'obsidian';

const noopSetViewData = function (
    this: void,
    _data: string,
    _clear: boolean,
): void {};
export const lockFile = (view: MandalaView) => {
    view.plugin.app.workspace.iterateAllLeaves((e) => {
        const leafView = e.view;
        if (leafView instanceof MarkdownView) {
            if (leafView.file === view.file) {
                const patchedView = leafView as MarkdownView & {
                    mandalaSetViewData?: MarkdownView['setViewData'];
                };
                const boundSetViewData = leafView.setViewData.bind(
                    leafView,
                ) as MarkdownView['setViewData'];
                patchedView.mandalaSetViewData = boundSetViewData;
                leafView.setViewData = noopSetViewData;
            }
        }
    });
};
