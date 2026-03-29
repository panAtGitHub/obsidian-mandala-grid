import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onViewStateUpdate } from 'src/stores/view/subscriptions/on-view-state-update';
import type { ViewStoreAction } from 'src/stores/view/view-store-actions';
import type { MandalaView } from 'src/view/view';

const mocks = vi.hoisted(() => ({
    persistCurrentMandalaViewState: vi.fn(),
    persistActiveNodeInPluginSettings: vi.fn(),
    updateSearchResults: vi.fn(),
    focusContainer: vi.fn(),
    align: vi.fn(),
    getUsedHotkeys: vi.fn(() => new Map()),
}));

vi.mock('src/mandala-settings/state/current-file/mandala-view-state', () => ({
    persistCurrentMandalaViewState: mocks.persistCurrentMandalaViewState,
}));

vi.mock('src/stores/view/subscriptions/actions/persist-active-node-in-plugin-settings', () => ({
    persistActiveNodeInPluginSettings:
        mocks.persistActiveNodeInPluginSettings,
}));

vi.mock('src/stores/view/subscriptions/actions/update-search-results', () => ({
    updateSearchResults: mocks.updateSearchResults,
}));

vi.mock('src/stores/view/subscriptions/effects/focus-container', () => ({
    focusContainer: mocks.focusContainer,
}));

vi.mock('src/obsidian/helpers/get-used-hotkeys', () => ({
    getUsedHotkeys: mocks.getUsedHotkeys,
}));

const createView = () =>
    ({
        container: {} as HTMLElement,
        isViewOfFile: true,
        alignBranch: {
            align: mocks.align,
        },
        plugin: {},
        viewStore: {
            getValue: () => ({
                document: {
                    activeNode: 'node-1',
                    editing: {
                        activeNodeId: '',
                        isInSidebar: false,
                    },
                },
                search: {
                    showInput: false,
                },
                ui: {
                    controls: {
                        showHelpSidebar: false,
                    },
                    previewDialog: {
                        open: false,
                    },
                },
            }),
            dispatch: vi.fn(),
        },
        recordPerfEvent: vi.fn(),
    }) as unknown as MandalaView;

const createLocalState = () => ({
    previousActiveNode: 'node-1',
    navigationSideEffectsTimer: null,
    hasPendingNavigationSideEffects: false,
});

describe('onViewStateUpdate', () => {
    beforeEach(() => {
        mocks.persistCurrentMandalaViewState.mockReset();
        mocks.persistActiveNodeInPluginSettings.mockReset();
        mocks.updateSearchResults.mockReset();
        mocks.focusContainer.mockReset();
        mocks.align.mockReset();
        mocks.getUsedHotkeys.mockClear();
    });

    it('persists the current file state when detail sidebar visibility changes', () => {
        const view = createView();
        const action: ViewStoreAction = {
            type: 'view/mandala/detail-sidebar/set',
            payload: { open: true },
        };

        onViewStateUpdate(view, action, createLocalState());

        expect(mocks.persistCurrentMandalaViewState).toHaveBeenCalledWith(view);
    });

    it('does not persist current file state for unrelated actions', () => {
        const view = createView();
        const action: ViewStoreAction = {
            type: 'view/search/set-query',
            payload: { query: 'abc' },
        };

        onViewStateUpdate(view, action, createLocalState());

        expect(mocks.persistCurrentMandalaViewState).not.toHaveBeenCalled();
        expect(mocks.updateSearchResults).toHaveBeenCalledWith(view);
    });

    it('skips document persistence for restore-only sidebar sync actions', () => {
        const view = createView();
        const action: ViewStoreAction = {
            type: 'view/mandala/detail-sidebar/set',
            payload: {
                open: false,
                persistInDocument: false,
            },
        };

        onViewStateUpdate(view, action, createLocalState());

        expect(mocks.persistCurrentMandalaViewState).not.toHaveBeenCalled();
    });
});
