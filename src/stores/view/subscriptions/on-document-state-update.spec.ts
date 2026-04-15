import { beforeEach, describe, expect, it, vi } from 'vitest';

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
vi.mock('src/stores/view/subscriptions/actions/update-stale-active-pinned-node', () => ({
    updateStaleActivePinnedNode: mocks.updateStaleActivePinnedNode,
}));
vi.mock('src/stores/view/subscriptions/actions/set-active-pinned-node', () => ({
    setActivePinnedNode: mocks.setActivePinnedNode,
}));
vi.mock('src/stores/view/subscriptions/actions/update-selected-nodes', () => ({
    updateSelectedNodes: mocks.updateSelectedNodes,
}));
vi.mock('src/stores/view/subscriptions/actions/load-pinned-nodes-to-document', () => ({
    loadPinnedNodesToDocument: mocks.loadPinnedNodesToDocument,
}));
vi.mock('src/stores/view/subscriptions/effects/document-sync/sync-swap-side-effects', () => ({
    syncSwapSideEffects: mocks.syncSwapSideEffects,
}));

import { onDocumentStateUpdate } from 'src/stores/view/subscriptions/on-document-state-update';

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
    container: object;
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
        isViewOfFile: true,
        isActive: true,
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

describe('on-document-state-update', () => {
    beforeEach(() => {
        Object.values(mocks).forEach((fn) => fn.mockReset());
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
});
