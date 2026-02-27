import { PluginAction } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';
import { MandalaView } from 'src/view/view';

export const skipAlign = (view: MandalaView, action: PluginAction) => {
    if (view.documentStore.getValue().meta.isMandala) return true;

    if (
        action.type === 'document/update-node-content' &&
        action.context.isInSidebar
    )
        return true;

    if (action.type === 'view/set-active-node/mouse-silent') return true;
};
