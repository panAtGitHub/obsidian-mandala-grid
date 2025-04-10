import { PluginAction } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';

export const delayAlign = (action: PluginAction) => {
    let delay = 0;
    if (
        action.type === 'view/left-sidebar/toggle' ||
        action.type === 'settings/view/toggle-minimap'
    ) {
        delay = 300;
    } else if (action.type === 'plugin/echo/workspace/resize') {
        delay = 50;
    } else if (action.type === 'view/life-cycle/mount') {
        delay = 16;
    } else if (action.type === 'view/update-active-branch?source=document') {
        const documentAction = action.context.documentAction;
        if (
            documentAction.type === 'document/add-node' ||
            documentAction.type === 'document/drop-node'
        ) {
            delay = 16;
        } else if (documentAction.type === 'document/move-node') {
            const horizontalMove =
                documentAction.payload.direction === 'left' ||
                documentAction.payload.direction === 'right';
            if (horizontalMove) delay = 16;
        }
    }
    return delay;
};
