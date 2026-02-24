import { MarkdownRenderer, type App, type Component } from 'obsidian';
import { formatText } from 'src/view/actions/markdown-preview/helpers/format-text';
import { markHiddenInfoElements } from 'src/view/actions/markdown-preview/helpers/mark-hidden-info-elements';

type RenderMarkdownContentOptions = {
    app: App;
    content: string;
    element: HTMLElement;
    sourcePath: string;
    component: Component;
    applyFormatText?: boolean;
    onAfterRender?: (element: HTMLElement) => void;
};

export const renderMarkdownContent = async ({
    app,
    content,
    element,
    sourcePath,
    component,
    applyFormatText = true,
    onAfterRender,
}: RenderMarkdownContentOptions) => {
    element.empty();

    const markdown =
        applyFormatText && content.length > 0 ? formatText(content) : content;
    if (!markdown) return;

    await MarkdownRenderer.render(app, markdown, element, sourcePath, component);
    markHiddenInfoElements(element);
    onAfterRender?.(element);
};
