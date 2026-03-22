import { MandalaView } from 'src/view/view';
import { sortNodeIdsBySectionNumber } from 'src/mandala-document/tree-utils/sort/sort-node-ids-by-section-number';

export const getTextOfFlatNodes = (
    view: MandalaView,
    nodes: string[],
    copyAsOutline = false,
) => {
    if (nodes.length === 1) copyAsOutline = false;
    const documentState = view.documentStore.getValue();
    const documentContent = documentState.document.content;
    const sortedNodes = sortNodeIdsBySectionNumber(
        documentState.sections,
        nodes,
    );
    return sortedNodes
        .map((id) => {
            const content = documentContent[id].content;
            return (copyAsOutline ? '- ' : '') + content;
        })
        .join(copyAsOutline ? '\n' : '\n\n');
};
