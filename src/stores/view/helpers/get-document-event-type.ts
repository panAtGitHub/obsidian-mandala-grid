import { DocumentStoreAction } from 'src/stores/document/document-store-actions';

const contentEvents = new Set<ActionType>([
    'document/update-node-content',
    'document/format-headings',
]);

const createAndDelete = new Set<ActionType>([
    'document/add-node',
    'document/delete-node',
    'document/merge-node',
    'document/file/load-from-disk',
    'document/extract-node',
    'document/split-node',
]);

const dropAndMoveEvents = new Set<ActionType>([
    'document/drop-node',
    'document/move-node',
    'document/sort-direct-child-nodes',
]);

const historyEvents = new Set<ActionType>([
    'document/history/select-next-snapshot',
    'document/history/select-previous-snapshot',
    'document/history/select-snapshot',
]);
const clipboardEvents = new Set<ActionType>([
    'document/paste-node',
    'document/cut-node',
]);

const cachedResults: { [key: string]: DocumentEventType } = {};

export type DocumentEventType = {
    content?: boolean;
    dropOrMove?: boolean;
    createOrDelete?: boolean;
    changeHistory?: boolean;
    clipboard?: boolean;
};
type ActionType = DocumentStoreAction['type'];
export const getDocumentEventType = (type: ActionType): DocumentEventType => {
    if (cachedResults[type]) {
        return cachedResults[type];
    }

    let result: DocumentEventType | null = null;
    if (contentEvents.has(type)) result = { content: true };
    else if (createAndDelete.has(type)) result = { createOrDelete: true };
    else if (dropAndMoveEvents.has(type)) result = { dropOrMove: true };
    else if (historyEvents.has(type)) result = { changeHistory: true };
    else if (clipboardEvents.has(type)) result = { clipboard: true };
    if (!result) result = {};

    cachedResults[type] = result;

    return result;
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
]);
