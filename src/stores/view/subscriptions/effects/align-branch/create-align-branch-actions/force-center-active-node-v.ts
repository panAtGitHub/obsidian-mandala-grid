import { getDocumentEventType } from 'src/stores/view/helpers/get-document-event-type';
import { PluginAction } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';

export const forceCenterActiveNodeV = (action: PluginAction) => {
    let centerActiveNodeV = false;
    centerActiveNodeV =
        action.type === 'view/life-cycle/mount' ||
        action.type === 'document/file/load-from-disk';

    if (!centerActiveNodeV && action.type.startsWith('document/')) {
        const type = getDocumentEventType(
            action.type as DocumentStoreAction['type'],
        );
        centerActiveNodeV =
            !!type.dropOrMove ||
            !!type.changeHistory ||
            (!!type.createOrDelete && action.type !== 'document/add-node');
    }
    return centerActiveNodeV;
};
