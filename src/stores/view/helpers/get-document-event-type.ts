import { DocumentStoreAction } from 'src/stores/document/document-store-actions';

export type DocumentEventType = {
    content?: boolean;
    dropOrMove?: boolean;
    createOrDelete?: boolean;
    clipboard?: boolean;
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

export const getDocumentEventType = (type: ActionType): DocumentEventType => {
    return documentEventTypes.get(type) || none;
};
