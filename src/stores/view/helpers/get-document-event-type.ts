import { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';
import { DocumentState } from 'src/mandala-document/state/document-state-type';

export type DocumentEventType = {
    content?: boolean;
    dropOrMove?: boolean;
    createOrDelete?: boolean;
    clipboard?: boolean;
    structural?: boolean;
};

type ActionType = DocumentStoreAction['type'];

const eventTypesDictionary: Partial<Record<ActionType, DocumentEventType>> = {
    'document/update-node-content': { content: true },
    'document/update-multiple-node-content': { content: true },
    'document/format-headings': { content: true },

    'document/file/load-from-disk': { createOrDelete: true },

    'document/mandala/swap': { content: true },
    'document/mandala/ensure-children': { createOrDelete: true },
    'document/mandala/ensure-core-theme': { createOrDelete: true },
    'document/mandala/clear-empty-subgrids': { createOrDelete: true },
} as const;

const documentEventTypes = new Map(Object.entries(eventTypesDictionary)) as Map<
    ActionType,
    DocumentEventType
>;

const none = {};

const resolveMandalaSwapType = (
    documentState?: Pick<DocumentState, 'meta'>,
): DocumentEventType => {
    const baseType = documentEventTypes.get('document/mandala/swap') || none;
    const mutation = documentState?.meta.mandalaV2.lastMutation;
    if (
        mutation?.actionType === 'document/mandala/swap' &&
        mutation.structural
    ) {
        return {
            ...baseType,
            createOrDelete: true,
            structural: true,
        };
    }
    return baseType;
};

export const getDocumentEventType = (
    action: ActionType | DocumentStoreAction,
    documentState?: Pick<DocumentState, 'meta'>,
): DocumentEventType => {
    const type = typeof action === 'string' ? action : action.type;
    if (type === 'document/mandala/swap') {
        return resolveMandalaSwapType(documentState);
    }
    return documentEventTypes.get(type) || none;
};
