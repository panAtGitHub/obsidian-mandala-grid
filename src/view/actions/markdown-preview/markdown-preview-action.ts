import type { App, Component } from 'obsidian';
import type { Readable } from 'svelte/store';
import { contentStore } from 'src/mandala-display/stores/document-derived-stores';
import { renderMarkdownContent } from 'src/view/actions/markdown-preview/helpers/render-markdown-content';
import type { MandalaView } from 'src/view/view';

type MarkdownPreviewRuntime = {
    app: App;
    component: Component;
    getSourcePath: () => string | null;
    contentForNode: (nodeId: string) => Readable<string>;
};

export const createMarkdownPreviewAction = (
    runtime: MarkdownPreviewRuntime,
) => {
    return (element: HTMLElement, nodeId: string) => {
        let currentNodeId = nodeId;
        let unsubscribe: () => void;

        const render = (content: string) => {
            const sourcePath = runtime.getSourcePath();
            if (!element || !sourcePath) return;
            const renderResult = renderMarkdownContent({
                app: runtime.app,
                content,
                element,
                sourcePath,
                component: runtime.component,
                applyFormatText: true,
            });
            void Promise.resolve(renderResult).catch(() => {
                // Keep existing behavior: rendering failure should not break subscription updates.
                element.empty();
            });
        };

        const subscribeToContent = (id: string) => {
            const $content = runtime.contentForNode(id);
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
};

export const createViewMarkdownPreviewAction = (view: MandalaView) =>
    createMarkdownPreviewAction({
        app: view.plugin.app,
        component: view,
        getSourcePath: () => view.file?.path ?? null,
        contentForNode: (nodeId: string) => contentStore(view, nodeId),
    });
