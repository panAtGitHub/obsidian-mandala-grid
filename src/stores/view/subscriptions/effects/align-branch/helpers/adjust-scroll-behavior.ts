import { PluginAction } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';

export const adjustScrollBehavior = (action: PluginAction) => {
    let behavior: ScrollBehavior = 'smooth';

    if (action.type === 'view/update-active-branch?source=document') {
        const documentAction = action.context.documentAction;
        const documentEvent = documentAction.type;
        if (documentEvent === 'document/file/load-from-disk') {
            behavior = 'instant';
        } else if (documentEvent === 'document/move-node') {
            const verticalMove =
                documentAction.payload.direction === 'down' ||
                documentAction.payload.direction === 'up';
            if (verticalMove) behavior = 'instant';
        }
    } else if (action.type === 'settings/view/set-zoom-level') {
        behavior = 'instant';
    }

    return behavior;
};
