import { alignElementHorizontally } from 'src/shared/lib/align-element/align-element-horizontally';
import { AlignBranchContext } from 'src/stores/view/subscriptions/effects/align-branch/helpers/create-context';

export const scrollFirstColumnToTheLeft = (context: AlignBranchContext) => {
    const firstColumnId = context.columns[0]?.id;
    if (!firstColumnId) return;

    alignElementHorizontally(context, firstColumnId, false, true);
};
