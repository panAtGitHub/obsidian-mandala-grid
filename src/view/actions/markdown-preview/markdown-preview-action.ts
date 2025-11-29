import { MarkdownRenderer } from 'obsidian';
import { getPlugin, getView } from 'src/view/components/container/context';
import { contentStore } from 'src/stores/document/derived/content-store';
import { formatText } from 'src/view/actions/markdown-preview/helpers/format-text';
import { markHiddenInfoElements } from 'src/view/actions/markdown-preview/helpers/mark-hidden-info-elements';

export const markdownPreviewAction = (element: HTMLElement, nodeId: string) => {
    const plugin = getPlugin();
    const view = getView();

    const render = (content: string) => {
        if (view && element) {
            element.empty();
            if (content.length > 0) {
                content = formatText(content);
            }
            const renderResult = MarkdownRenderer.render(
                plugin.app,
                content,
                element,
                view.file!.path,
                view,
            );
            Promise.resolve(renderResult).then(() =>
                markHiddenInfoElements(element),
            );
        }
    };

    const $content = contentStore(view, nodeId);
    const unsub = $content.subscribe((content) => {
        render(content);
    });
    return {
        destroy: () => {
            unsub();
        },
    };
};
