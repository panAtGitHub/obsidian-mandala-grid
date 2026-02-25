import { Column } from 'src/stores/document/document-state-type';
import { DocumentViewState, ViewState } from 'src/stores/view/view-state-type';
import { addNavigationHistoryItem } from 'src/stores/view/reducers/ui/helpers/add-navigation-history-item';
import { disableEditMode } from 'src/stores/view/reducers/document/disable-edit-mode';
import { resetPendingConfirmation } from 'src/stores/view/reducers/document/reset-pending-confirmation';
import { logger } from 'src/helpers/logger';
import { resolveSafeActiveNode } from 'src/stores/view/reducers/document/helpers/active-node-safety';

export const updateActiveNode = (
    documentState: DocumentViewState,
    nodeId: string,
    state: null | Pick<ViewState, 'navigationHistory'>,
    columns?: Column[],
) => {
    if (columns) {
        const safeNodeId = resolveSafeActiveNode(
            columns,
            nodeId,
            documentState.activeNode,
        );
        if (!safeNodeId) {
            logger.warn('[view] skip active node update: no valid node found');
            return;
        }
        if (safeNodeId !== nodeId) {
            logger.warn(
                '[view] stale active node id fallback',
                nodeId,
                '->',
                safeNodeId,
            );
        }
        nodeId = safeNodeId;
    }
    documentState.activeNode = nodeId;
    if (state) addNavigationHistoryItem(state, documentState.activeNode);

    const activeNodeId = documentState.editing.activeNodeId;
    if (activeNodeId !== nodeId || documentState.editing.isInSidebar)
        disableEditMode(documentState);

    resetPendingConfirmation(documentState);
};
