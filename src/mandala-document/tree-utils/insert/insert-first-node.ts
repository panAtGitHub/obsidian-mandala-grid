import { id } from 'src/helpers/id';
import { Column, Content } from 'src/mandala-document/state/document-state-type';

export const insertFirstNode = (columns: Column[], content: Content) => {
    const rootId = id.rootNode();
    const createdNode = id.node();
    if (columns.length === 0) {
        content[createdNode] = { content: '' };
        columns.push({
            id: id.column(),
            groups: [
                {
                    parentId: rootId,
                    nodes: [createdNode],
                },
            ],
        });
    } else if (
        columns.length === 1 &&
        columns[0].groups.length === 1 &&
        columns[0].groups[0].nodes.length === 0
    ) {
        content[createdNode] = { content: '' };
        columns[0].groups[0].nodes = [createdNode];
    } else throw new Error('document is not empty');
    return createdNode;
};
