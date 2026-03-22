import { NodeGroup } from 'src/mandala-document/state/document-state-type';

export const createGroup = (parentId: string): NodeGroup => ({
    nodes: [],
    parentId,
});
