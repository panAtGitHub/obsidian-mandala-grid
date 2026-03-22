import { getDocumentEventType } from 'src/stores/view/helpers/get-document-event-type';
import { PluginAction } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';
import { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';
import { CreateActionsContext } from 'src/stores/view/subscriptions/effects/align-branch/create-align-branch-actions/create-align-branch-actions';

export const forceCenterActiveNodeV = (
    context: CreateActionsContext,
    action: PluginAction,
) => {
    let centerActiveNodeV = false;
    centerActiveNodeV =
        action.type === 'view/life-cycle/mount' ||
        action.type === 'document/file/load-from-disk';

    if (!centerActiveNodeV && action.type.startsWith('document/')) {
        const type = getDocumentEventType(
            action as DocumentStoreAction,
            context.documentState,
        );
        centerActiveNodeV = Boolean(
            type.structural || type.dropOrMove || type.createOrDelete,
        );
    }
    return centerActiveNodeV;
};
