import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    focusContainer: vi.fn(),
    updateSearchResults: vi.fn(),
    setActiveNode: vi.fn(),
    persistPinnedNodes: vi.fn(),
    updateStaleActivePinnedNode: vi.fn(),
    setActivePinnedNode: vi.fn(),
    updateSelectedNodes: vi.fn(),
    loadPinnedNodesToDocument: vi.fn(),
    syncSwapSideEffects: vi.fn(),
}));

vi.mock('src/stores/view/subscriptions/effects/focus-container', () => ({
    focusContainer: mocks.focusContainer,
}));
vi.mock('src/stores/view/subscriptions/actions/update-search-results', () => ({
    updateSearchResults: mocks.updateSearchResults,
}));
vi.mock('src/stores/view/subscriptions/actions/set-active-node', () => ({
    setActiveNode: mocks.setActiveNode,
}));
vi.mock('src/stores/view/subscriptions/actions/persist-pinned-nodes', () => ({
    persistPinnedNodes: mocks.persistPinnedNodes,
}));
vi.mock(
    'src/stores/view/subscriptions/actions/update-stale-active-pinned-node',
    () => ({
        updateStaleActivePinnedNode: mocks.updateStaleActivePinnedNode,
    }),
);
vi.mock('src/stores/view/subscriptions/actions/set-active-pinned-node', () => ({
    setActivePinnedNode: mocks.setActivePinnedNode,
}));
vi.mock('src/stores/view/subscriptions/actions/update-selected-nodes', () => ({
    updateSelectedNodes: mocks.updateSelectedNodes,
}));
vi.mock(
    'src/stores/view/subscriptions/actions/load-pinned-nodes-to-document',
    () => ({
        loadPinnedNodesToDocument: mocks.loadPinnedNodesToDocument,
    }),
);
vi.mock(
    'src/stores/view/subscriptions/effects/document-sync/sync-swap-side-effects',
    () => ({
        syncSwapSideEffects: mocks.syncSwapSideEffects,
    }),
);

import { onDocumentStateUpdate } from 'src/stores/view/subscriptions/on-document-state-update';
import { Store } from 'src/shared/store/store';
import { PersistSnapshotQueue } from 'src/view/helpers/persist-snapshot-queue';
import type { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';

type MockView = {
    documentStore: {
        getValue: ReturnType<typeof vi.fn>;
        batch: ReturnType<typeof vi.fn>;
        dispatch: ReturnType<typeof vi.fn>;
    };
    viewStore: {
        setContext: ReturnType<typeof vi.fn>;
        getValue: ReturnType<typeof vi.fn>;
        batch: ReturnType<typeof vi.fn>;
        dispatch: ReturnType<typeof vi.fn>;
    };
    container: object | null;
    isViewOfFile: boolean;
    isActive: boolean;
    documentSearch: {
        applyDocumentAction: ReturnType<typeof vi.fn>;
    };
    alignBranch: {
        align: ReturnType<typeof vi.fn>;
    };
    inlineEditor: {
        unloadNode: ReturnType<typeof vi.fn>;
    };
    saveDocument: ReturnType<typeof vi.fn>;
    plugin: {
        statusBar: {
            updateAll: ReturnType<typeof vi.fn>;
        };
    };
};

const createView = () => {
    const documentState = {
        sections: {
            id_section: {
                'node-1': '1',
            },
        },
        meta: {
            mandalaV2: {
                lastMutation: null,
            },
        },
        document: {
            content: {
                'node-1': {
                    content: 'hello',
                },
            },
        },
    };

    return {
        documentStore: {
            getValue: vi.fn(() => documentState),
            batch: vi.fn((run: () => void) => run()),
            dispatch: vi.fn(),
        },
        viewStore: {
            setContext: vi.fn(),
            getValue: vi.fn(() => ({ search: { query: 'q' } })),
            batch: vi.fn((run: () => void) => run()),
            dispatch: vi.fn(),
        },
        container: {},
        isViewOfFile: Boolean(true),
        isActive: Boolean(true),
        documentSearch: {
            applyDocumentAction: vi.fn(),
        },
        alignBranch: {
            align: vi.fn(),
        },
        inlineEditor: {
            unloadNode: vi.fn(),
        },
        saveDocument: vi.fn(() => Promise.resolve()),
        plugin: {
            statusBar: {
                updateAll: vi.fn(),
            },
        },
    } satisfies MockView;
};

// Exercise the real subscriber and persistence queues with a shared document
// store. The view serializer is stubbed; these tests cover save dispatch and
// queue ordering rather than Markdown serialization or Obsidian rendering.
const createPersistenceHarness = (
    persist: (path: string, data: string) => Promise<void>,
) => {
    const documentStore = new Store(
        createView().documentStore.getValue(),
        (state, action: DocumentStoreAction) => {
            if (action.type === 'document/update-node-content') {
                state.document.content['node-1'].content =
                    action.payload.content;
            }
            return state;
        },
    );
    const attachView = (isViewOfFile = false) => {
        const view = createView();
        view.isViewOfFile = isViewOfFile;
        view.isActive = false;
        view.documentStore.getValue.mockImplementation(() =>
            documentStore.getValue(),
        );
        const queue = new PersistSnapshotQueue({ delayMs: 2000, persist });
        view.saveDocument.mockImplementation(() => {
            queue.queue(
                'note.md',
                documentStore.getValue().document.content['node-1'].content,
            );
            return Promise.resolve();
        });
        const unsubscribe = documentStore.subscribe((_state, action) => {
            if (action) onDocumentStateUpdate(view as never, action);
        });
        return {
            view,
            queue,
            close: async () => {
                await queue.flushAll();
                unsubscribe();
            },
        };
    };
    return {
        attachView,
        edit: (content: string) =>
            documentStore.dispatch({
                type: 'document/update-node-content',
                payload: { nodeId: 'node-1', content },
                context: { isInSidebar: false },
            }),
    };
};

describe('on-document-state-update', () => {
    beforeEach(() => {
        Object.values(mocks).forEach((fn) => fn.mockReset());
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('flushes embedded edits when the popover closes before the save timer', async () => {
        vi.useFakeTimers();
        const persist = vi.fn<[string, string], Promise<void>>();
        persist.mockResolvedValue(undefined);
        const harness = createPersistenceHarness(persist);
        const embedded = harness.attachView();

        harness.edit('popover edit');
        expect(persist).not.toHaveBeenCalled();
        await embedded.close();

        expect(persist).toHaveBeenCalledWith('note.md', 'popover edit');
    });

    it('keeps the latest edit when two views save the shared document and one closes', async () => {
        vi.useFakeTimers();
        const persisted: string[] = [];
        const harness = createPersistenceHarness((_path, data) => {
            persisted.push(data);
            return Promise.resolve();
        });
        const main = harness.attachView(true);
        const embedded = harness.attachView();

        harness.edit('first edit');
        harness.edit('latest edit');
        await embedded.close();
        await vi.advanceTimersByTimeAsync(2000);

        expect(persisted).toEqual(['latest edit', 'latest edit']);
        harness.edit('edit after popover closes');
        await main.close();
        expect(persisted.at(-1)).toBe('edit after popover closes');
    });

    it('flushes a newer edit received while a closing view has an older save in flight', async () => {
        vi.useFakeTimers();
        const persisted: string[] = [];
        let releaseFirstWrite = () => {};
        const firstWrite = new Promise<void>((resolve) => {
            releaseFirstWrite = resolve;
        });
        const harness = createPersistenceHarness(async (_path, data) => {
            if (data === 'first edit') await firstWrite;
            persisted.push(data);
        });
        const embedded = harness.attachView();

        harness.edit('first edit');
        const closing = embedded.close();
        await vi.advanceTimersByTimeAsync(0);
        harness.edit('newer edit');
        releaseFirstWrite();
        await closing;

        expect(persisted).toEqual(['first edit', 'newer edit']);
    });

    it('saves edits from an embedded view that is not the registered file owner', () => {
        const view = createView();
        view.isViewOfFile = false;
        view.isActive = false;

        onDocumentStateUpdate(view as never, {
            type: 'document/update-node-content',
            payload: { nodeId: 'node-1', content: 'embedded edit' },
            context: { isInSidebar: false },
        });

        expect(view.saveDocument).toHaveBeenCalledWith({
            mode: 'content-only',
            changedSections: ['1'],
        });
        expect(mocks.focusContainer).not.toHaveBeenCalled();
    });

    it('does not save before a view has mounted its container', () => {
        const view: MockView = createView();
        view.container = null;

        onDocumentStateUpdate(view as never, {
            type: 'document/update-node-content',
            payload: { nodeId: 'node-1', content: 'unmounted edit' },
            context: { isInSidebar: false },
        });

        expect(view.saveDocument).not.toHaveBeenCalled();
    });

    it('persists blur commits but does not refocus when suppressRefocus is true', () => {
        const view = createView();

        onDocumentStateUpdate(view as never, {
            type: 'document/update-node-content',
            payload: {
                nodeId: 'node-1',
                content: 'next',
            },
            context: {
                isInSidebar: false,
                commitReason: 'blur',
                suppressRefocus: true,
            },
        });

        expect(view.saveDocument).toHaveBeenCalledTimes(1);
        expect(view.alignBranch.align).toHaveBeenCalledTimes(1);
        expect(mocks.updateSearchResults).toHaveBeenCalledTimes(1);
        expect(mocks.focusContainer).not.toHaveBeenCalled();
    });

    it('keeps existing refocus behavior when suppressRefocus is missing', () => {
        const view = createView();

        onDocumentStateUpdate(view as never, {
            type: 'document/update-node-content',
            payload: {
                nodeId: 'node-1',
                content: 'next',
            },
            context: {
                isInSidebar: false,
            },
        });

        expect(view.saveDocument).toHaveBeenCalledTimes(1);
        expect(mocks.focusContainer).toHaveBeenCalledTimes(1);
    });

    it('does not trigger content side effects for pinned-node actions', () => {
        const view = createView();

        onDocumentStateUpdate(view as never, {
            type: 'document/pinned-nodes/pin',
            payload: {
                id: 'node-1',
            },
        });

        expect(view.saveDocument).not.toHaveBeenCalled();
        expect(view.alignBranch.align).not.toHaveBeenCalled();
        expect(mocks.updateSearchResults).not.toHaveBeenCalled();
        expect(mocks.focusContainer).not.toHaveBeenCalled();
        expect(mocks.persistPinnedNodes).toHaveBeenCalledTimes(1);
    });

    it('discards the inline edit buffer before an external document reload', () => {
        const view = createView();

        onDocumentStateUpdate(view as never, {
            type: 'document/file/load-from-disk',
            payload: {
                document: {
                    data: '<!--section: 1-->external',
                    frontmatter: '',
                    position: null,
                },
                activeSection: null,
            },
        });

        expect(view.inlineEditor.unloadNode).toHaveBeenCalledWith(
            undefined,
            true,
        );
        expect(mocks.loadPinnedNodesToDocument).toHaveBeenCalledTimes(1);
    });
});
