import { findNodePosition } from 'src/lib/tree-utils/find/find-node-position';
import { LineageDocument } from 'src/stores/document/document-state-type';
import { SilentError } from 'src/lib/errors/errors';

export type MandalaSwapAction = {
    type: 'document/mandala/swap';
    payload: {
        sourceNodeId: string;
        targetNodeId: string;
    };
};

export const swapMandalaNodes = (
    document: Pick<LineageDocument, 'columns'>,
    sourceNodeId: string,
    targetNodeId: string,
) => {
    if (sourceNodeId === targetNodeId) return;
    const a = findNodePosition(document.columns, sourceNodeId);
    const b = findNodePosition(document.columns, targetNodeId);
    if (!a || !b) throw new SilentError('could not find node position');

    const groupA = document.columns[a.columnIndex].groups[a.groupIndex];
    const groupB = document.columns[b.columnIndex].groups[b.groupIndex];

    groupA.nodes[a.nodeIndex] = targetNodeId;
    groupB.nodes[b.nodeIndex] = sourceNodeId;

    // ensure reactive updates
    groupA.nodes = [...groupA.nodes];
    if (groupB !== groupA) {
        groupB.nodes = [...groupB.nodes];
    }
};

