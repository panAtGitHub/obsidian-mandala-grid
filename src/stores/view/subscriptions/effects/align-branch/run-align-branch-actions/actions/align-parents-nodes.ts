import { AlignBranchContext } from 'src/stores/view/subscriptions/effects/align-branch/helpers/create-context';
import { alignElementVertically } from 'src/shared/lib/align-element/align-element-vertically';

export const alignParentsNodes = (
    context: AlignBranchContext,
    relativeId: string | null,
) => {
    for (const id of context.activeBranch.sortedParentNodes) {
        alignElementVertically(context, id, relativeId, true);
    }
};
