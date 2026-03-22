import { alignElementVertically } from 'src/shared/lib/align-element/align-element-vertically';
import { AlignBranchContext } from 'src/stores/view/subscriptions/effects/align-branch/helpers/create-context';
import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';

export const alignInactiveColumns = (context: AlignBranchContext) => {
    const activeNodeColumn = findNodeColumn(
        context.columns,
        context.activeBranch.node,
    );
    const inactiveColumns = context.columns.filter((c, i) => {
        return (
            i > activeNodeColumn &&
            !c.groups.some(
                (g) =>
                    context.activeBranch.childGroups.has(g.parentId) &&
                    g.nodes.length > 0,
            )
        );
    });
    for (const column of inactiveColumns) {
        const nodes = column.groups.map((g) => g.nodes).flat();
        alignElementVertically(context, nodes[nodes.length - 1], null, true);
    }
};
