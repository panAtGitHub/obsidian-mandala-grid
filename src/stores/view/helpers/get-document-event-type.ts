import { DocumentStoreAction } from 'src/stores/document/document-store-actions';

export type DocumentEventType = {
    content?: boolean;
    dropOrMove?: boolean;
    createOrDelete?: boolean;
    changeHistory?: boolean;
    clipboard?: boolean;
};

type ActionType = DocumentStoreAction['type'];

const eventTypesDictionary: Partial<Record<ActionType, DocumentEventType>> = {
    'document/update-node-content': { content: true },
    'document/format-headings': { content: true },

    'document/add-node': { createOrDelete: true },
    'document/delete-node': { createOrDelete: true },
    'document/merge-node': { createOrDelete: true },
    'document/file/load-from-disk': { createOrDelete: true },
    'document/extract-node': { createOrDelete: true },
    'document/split-node': { createOrDelete: true },

    'document/drop-node': { dropOrMove: true },
    'document/move-node': { dropOrMove: true },
    'document/sort-direct-child-nodes': { dropOrMove: true },
    'document/mandala/swap': { dropOrMove: true },
    'document/mandala/ensure-children': { createOrDelete: true },
    'document/mandala/ensure-core-theme': { createOrDelete: true },
    'document/mandala/clear-empty-subgrids': { createOrDelete: true },

    'document/history/select-next-snapshot': { changeHistory: true },
    'document/history/select-previous-snapshot': { changeHistory: true },
    'document/history/select-snapshot': { changeHistory: true },

    'document/paste-node': { clipboard: true },
    'document/cut-node': { clipboard: true },
} as const;

const documentEventTypes = new Map(Object.entries(eventTypesDictionary)) as Map<
    ActionType,
    DocumentEventType
>;

const none = {};

export const getDocumentEventType = (type: ActionType): DocumentEventType => {
    return documentEventTypes.get(type) || none;
};

export const STRUCTURE_AND_CONTENT = new Set<DocumentStoreAction['type']>([
    // full
    'document/history/select-next-snapshot',
    'document/history/select-previous-snapshot',
    'document/history/select-snapshot',
    'document/file/load-from-disk',

    // partial
    'document/merge-node',
    'document/split-node',
    'document/delete-node',
    'document/extract-node',
    'document/cut-node',
]);

export const CONTENT_ONLY = new Set<DocumentStoreAction['type']>([
    'document/update-node-content',
    'document/format-headings',
]);

export const STRUCTURE_ONLY = new Set<DocumentStoreAction['type']>([
    'document/drop-node',
    'document/move-node',
    'document/add-node',
    'document/paste-node',
    'document/sort-direct-child-nodes',
    'document/mandala/swap',
    'document/mandala/ensure-children',
    'document/mandala/ensure-core-theme',
    'document/mandala/clear-empty-subgrids',
    'document/mandala/clear-empty-subgrids',
]);
