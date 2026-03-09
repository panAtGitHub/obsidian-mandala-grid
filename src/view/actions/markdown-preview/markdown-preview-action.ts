import { getPlugin, getView } from 'src/view/components/container/context';
import { contentStore } from 'src/stores/document/derived/content-store';
import { renderMarkdownContent } from 'src/view/actions/markdown-preview/helpers/render-markdown-content';

export const markdownPreviewAction = (element: HTMLElement, nodeId: string) => {
    const plugin = getPlugin();
    const view = getView();

    let currentNodeId = nodeId;
    let unsubscribe: () => void;

    const render = (content: string) => {
        if (view && element) {
            const renderResult = renderMarkdownContent({
                app: plugin.app,
                content,
                element,
                sourcePath: view.file!.path,
                component: view,
                applyFormatText: true,
            });
            void Promise.resolve(renderResult).catch(() => {
                // Keep existing behavior: rendering failure should not break subscription updates.
                element.empty();
            });
        }
    };

    const subscribeToContent = (id: string) => {
        const $content = contentStore(view, id);
        return $content.subscribe((nextContent) => {
            void render(nextContent);
        });
    };

    unsubscribe = subscribeToContent(currentNodeId);

    return {
        update: (nextNodeId: string) => {
            if (nextNodeId === currentNodeId) return;
            unsubscribe();
            currentNodeId = nextNodeId;
            unsubscribe = subscribeToContent(currentNodeId);
        },
        destroy: () => {
            unsubscribe();
        },
    };
};
