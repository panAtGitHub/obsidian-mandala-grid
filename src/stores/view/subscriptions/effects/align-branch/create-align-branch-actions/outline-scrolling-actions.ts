import { PluginAction } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';
import {
    AlignBranchAction,
    CreateActionsContext,
} from 'src/stores/view/subscriptions/effects/align-branch/create-align-branch-actions/create-align-branch-actions';

export const outlineScrollingActions = (
    context: CreateActionsContext,
    action: PluginAction,
) => {
    const actions: AlignBranchAction[] = [];
    const settings = context.alignBranchSettings;

    const forceCenterActiveNodeV =
        action.type === 'view/life-cycle/mount' ||
        action.type === 'document/file/load-from-disk';

    if (forceCenterActiveNodeV) {
        actions.push({ action: '20/active-node/horizontal/center' });
        actions.push({ action: '20/active-node/vertical/center' });
    } else {
        if (settings.centerActiveNodeH) {
            actions.push({ action: '20/active-node/horizontal/center' });
        } else {
            actions.push({ action: '20/active-node/horizontal/reveal' });
        }
        if (settings.centerActiveNodeV) {
            actions.push({ action: '20/active-node/vertical/center' });
        } else {
            actions.push({ action: '20/active-node/vertical/reveal' });
        }
    }

    if (action.type === 'view/life-cycle/mount') {
        actions.push({
            action: '10/first-column/horizontal/move-to-the-left',
        });
    }
    return actions;
};
