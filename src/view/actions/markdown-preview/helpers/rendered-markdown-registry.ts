const markdownByElement = new WeakMap<HTMLElement, string>();

export const rememberRenderedMarkdown = (
    element: HTMLElement,
    markdown: string,
) => {
    markdownByElement.set(element, markdown);
};

export const findRenderedMarkdown = (element: HTMLElement) => {
    let cursor: HTMLElement | null = element;

    while (cursor) {
        const markdown = markdownByElement.get(cursor);
        if (typeof markdown === 'string') {
            return markdown;
        }
        cursor = cursor.parentElement;
    }

    return null;
};
