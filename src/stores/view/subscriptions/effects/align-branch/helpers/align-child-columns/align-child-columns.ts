import { AlignBranchContext } from 'src/stores/view/subscriptions/effects/align-branch/helpers/create-context';
import { alignChildGroupOfColumn } from 'src/stores/view/subscriptions/effects/align-branch/helpers/align-child-columns/align-child-group-of-column';
import { alignElementVertically } from 'src/shared/lib/align-element/align-element-vertically';
import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';

const getActiveNodeOfGroup = (
    context: AlignBranchContext,
    column: string,
    previousActiveNode: string | null,
) => {
    const activeNodesOfColumn = context.activeNodesOfColumn;
    return activeNodesOfColumn[column] && previousActiveNode
        ? activeNodesOfColumn[column][previousActiveNode]
        : null;
};

export const alignChildColumns = (
    context: AlignBranchContext,
    relativeId: string | null,
    center: boolean,
) => {
    const columns = context.columns;
    const activeNode = context.activeBranch.node;
    let previousActiveNode: string | null = activeNode;
    const activeNodeColumn = findNodeColumn(columns, activeNode);

    for (let i = activeNodeColumn + 1; i < columns.length; i++) {
        const column = columns[i];

        const activeNodeOfGroup = getActiveNodeOfGroup(
            context,
            column.id,
            previousActiveNode,
        );
        previousActiveNode = activeNodeOfGroup;

        if (activeNodeOfGroup) {
            alignElementVertically(
                context,
                activeNodeOfGroup,
                relativeId,
                center,
            );
        } else {
            const childGroups = context.activeBranch.childGroups;
            const columnHasChildGroup = !!column.groups.find((g) =>
                childGroups.has(g.parentId),
            );
            if (columnHasChildGroup) {
                alignChildGroupOfColumn(context, column, relativeId, center);
            }
        }
    }
};
