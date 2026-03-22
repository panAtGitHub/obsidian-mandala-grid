import { Content } from 'src/mandala-document/state/document-state-type';
import { logger } from 'src/shared/helpers/logger';

export type SetNodeContentAction = {
    type: 'document/update-node-content';
    payload: {
        nodeId: string;
        content: string;
    };
    context: {
        isInSidebar: boolean;
    };
};

export type SetMultipleNodeContentAction = {
    type: 'document/update-multiple-node-content';
    payload: {
        updates: Array<{
            nodeId: string;
            content: string;
        }>;
    };
    context: {
        isInSidebar: boolean;
    };
};

export const setNodeContent = (
    content: Content,
    action: Pick<SetNodeContentAction, 'payload'>,
) => {
    const nodeContent = content[action.payload.nodeId];
    if (!nodeContent) {
        logger.warn(
            '[document] ignore update-node-content for stale node',
            action.payload.nodeId,
        );
        return false;
    }
    const contentString = nodeContent?.content || '';
    if (contentString === action.payload.content) return false;
    nodeContent.content = action.payload.content;
    return true;
};

export const setMultipleNodeContent = (
    content: Content,
    action: Pick<SetMultipleNodeContentAction, 'payload'>,
) => {
    const changedNodeIds: string[] = [];
    for (const update of action.payload.updates) {
        const nodeContent = content[update.nodeId];
        if (!nodeContent) continue;
        const current = nodeContent?.content || '';
        if (current === update.content) continue;
        nodeContent.content = update.content;
        changedNodeIds.push(update.nodeId);
    }
    return changedNodeIds;
};
