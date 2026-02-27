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
        void action.context.documentAction;
    }
    return delay;
};
