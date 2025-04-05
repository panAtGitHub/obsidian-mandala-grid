import { LineageView } from 'src/view/view';

export const copyNodesToClipboard = async (
    view: LineageView,
    nodes: string[],
    copyAsOutline = false,
) => {
    const documentContent = view.documentStore.getValue().document.content;
    if (nodes.length === 1) copyAsOutline = false;
    const text = nodes
        .map((id) => {
            const content = documentContent[id].content;
            return (copyAsOutline ? '- ' : '') + content;
        })
        .join('\n');
    await navigator.clipboard.writeText(text);
};
