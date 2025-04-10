import { Content } from 'src/stores/document/document-state-type';

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
export const setNodeContent = (
    content: Content,
    action: Pick<SetNodeContentAction, 'payload'>,
) => {
    const nodeContent = content[action.payload.nodeId];
    const contentString = nodeContent?.content || '';
    if (contentString === action.payload.content) return false;
    const nodeId = action.payload.nodeId;
    if (!nodeContent) content[nodeId] = { content: action.payload.content };
    else nodeContent.content = action.payload.content;
    return true;
};
