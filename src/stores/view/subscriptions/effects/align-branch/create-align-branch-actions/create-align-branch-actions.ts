import { forceCenterActiveNodeV } from 'src/stores/view/subscriptions/effects/align-branch/create-align-branch-actions/force-center-active-node-v';
import { lazyVerticalScrollingMode } from 'src/stores/view/subscriptions/effects/align-branch/create-align-branch-actions/lazy-vertical-scrolling-mode';
import { AlignBranchContext } from 'src/stores/view/subscriptions/effects/align-branch/helpers/create-context';
import { PluginAction } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';
import { outlineScrollingActions } from 'src/stores/view/subscriptions/effects/align-branch/create-align-branch-actions/outline-scrolling-actions';
import { forceCenterActiveNodeH } from 'src/stores/view/subscriptions/effects/align-branch/create-align-branch-actions/force-center-active-node-h';

export type AlignBranchAction = {
    action:
        | '10/first-column/horizontal/move-to-the-left'
        | '20/active-node/vertical/center'
        | '20/active-node/vertical/reveal'
        | '20/active-node/vertical/align-with-parent'
        | '20/active-node/horizontal/center'
        | '20/active-node/horizontal/reveal'
        | '30/parents/vertical/center'
        | '30/parents/vertical/align-with-active-node'
        | '40/children/vertical/center'
        | '40/children/vertical/align-with-active-node'
        | '50/inactive-columns/vertical/move-up';
};

export type CreateActionsContext = Pick<
    AlignBranchContext,
    | 'previousActiveBranch'
    | 'activeBranch'
    | 'outlineMode'
    | 'alignBranchSettings'
>;
export const createAlignBranchActions = (
    context: CreateActionsContext,
    action: PluginAction,
): AlignBranchAction[] => {
    const actions: AlignBranchAction[] = [];
    if (action.type === 'view/update-active-branch?source=document') {
        action = action.context.documentAction;
    }

    if (action.type === 'view/align-branch/reveal-node') {
        /* used to keep active node visible while editing*/
        actions.push({ action: '20/active-node/vertical/reveal' });
        actions.push({ action: '20/active-node/horizontal/reveal' });
        return actions;
    } else if (action.type === 'view/align-branch/center-node') {
        actions.push({ action: '20/active-node/vertical/center' });
        actions.push({ action: '20/active-node/horizontal/center' });
        if (!context.outlineMode) {
            actions.push({ action: '30/parents/vertical/center' });
            actions.push({ action: '40/children/vertical/center' });
        }
        return actions;
    }

    if (context.outlineMode) {
        return outlineScrollingActions(context, action);
    }

    const settings = context.alignBranchSettings;
    if (settings.centerActiveNodeH || forceCenterActiveNodeH(context, action)) {
        actions.push({ action: '20/active-node/horizontal/center' });
    } else {
        actions.push({ action: '20/active-node/horizontal/reveal' });
    }

    if (settings.centerActiveNodeV || forceCenterActiveNodeV(action)) {
        actions.push({ action: '20/active-node/vertical/center' });
        actions.push({ action: '30/parents/vertical/center' });
        actions.push({ action: '40/children/vertical/center' });
    } else {
        actions.push(...lazyVerticalScrollingMode(context, action));
    }

    if (
        action.type === 'view/life-cycle/mount' ||
        action.type === 'document/split-node' ||
        action.type === 'document/file/load-from-disk'
    ) {
        actions.push({ action: '50/inactive-columns/vertical/move-up' });
    }
    if (
        !settings.centerActiveNodeH &&
        (action.type === 'view/life-cycle/mount' ||
            action.type === 'settings/view/set-zoom-level')
    ) {
        actions.push({
            action: '10/first-column/horizontal/move-to-the-left',
        });
    }
    return actions;
};
