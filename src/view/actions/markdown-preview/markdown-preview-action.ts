import { MarkdownRenderer } from 'obsidian';
import { getPlugin, getView } from 'src/view/components/container/context';
import { contentStore } from 'src/stores/document/derived/content-store';
import { formatText } from 'src/view/actions/markdown-preview/helpers/format-text';

export const markdownPreviewAction = (element: HTMLElement, nodeId: string) => {
    const plugin = getPlugin();
    const view = getView();

    const render = (content: string) => {
        if (view && element) {
            element.empty();
            if (content.length > 0) {
                content = formatText(content);
            }
            MarkdownRenderer.render(
                plugin.app,
                content,
                element,
                view.file!.path,
                view,
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
