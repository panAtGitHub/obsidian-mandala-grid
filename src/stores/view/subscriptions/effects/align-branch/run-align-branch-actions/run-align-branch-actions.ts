import { AlignBranchContext } from 'src/stores/view/subscriptions/effects/align-branch/helpers/create-context';
import { AlignBranchAction } from 'src/stores/view/subscriptions/effects/align-branch/create-align-branch-actions/create-align-branch-actions';
import { scrollFirstColumnToTheLeft } from 'src/stores/view/subscriptions/effects/align-branch/run-align-branch-actions/actions/scroll-first-column-to-the-left';
import { alignElementVertically } from 'src/shared/lib/align-element/align-element-vertically';
import { alignElementHorizontally } from 'src/shared/lib/align-element/align-element-horizontally';
import { alignParentsNodes } from 'src/stores/view/subscriptions/effects/align-branch/run-align-branch-actions/actions/align-parents-nodes';
import { alignChildColumns } from 'src/stores/view/subscriptions/effects/align-branch/helpers/align-child-columns/align-child-columns';
import { alignInactiveColumns } from 'src/stores/view/subscriptions/effects/align-branch/helpers/align-child-columns/align-inactive-columns';

export const runAlignBranchActions = (
    context: AlignBranchContext,
    actions: AlignBranchAction[],
    signal: AbortSignal,
) => {
    actions = actions.sort((a, b) => a.action.localeCompare(b.action));
    const activeNode = context.activeBranch.node;
    for (const action of actions) {
        if (signal.aborted) return;
        const type = action.action;
        if (type === '10/first-column/horizontal/move-to-the-left') {
            scrollFirstColumnToTheLeft(context);
        } else if (type === '20/active-node/horizontal/center') {
            alignElementHorizontally(context, activeNode, true, false);
        } else if (type === '20/active-node/horizontal/reveal') {
            alignElementHorizontally(context, activeNode, false, false);
        } else if (type === '20/active-node/vertical/center') {
            alignElementVertically(context, activeNode, null, true);
        } else if (type === '20/active-node/vertical/reveal') {
            alignElementVertically(context, activeNode, null, false);
        } else if (type === '20/active-node/vertical/align-with-parent') {
            alignElementVertically(
                context,
                activeNode,
                context.activeBranch.group,
                false,
            );
        } else if (type === '30/parents/vertical/center') {
            alignParentsNodes(context, null);
        } else if (type === '30/parents/vertical/align-with-active-node') {
            alignParentsNodes(context, activeNode);
        } else if (type === '40/children/vertical/center') {
            alignChildColumns(context, null, true);
        } else if (type === '40/children/vertical/align-with-active-node') {
            alignChildColumns(context, activeNode, false);
        } else if (type === '50/inactive-columns/vertical/move-up') {
            alignInactiveColumns(context);
        }
    }
};
