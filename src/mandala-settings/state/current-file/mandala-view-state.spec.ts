import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Platform } from 'obsidian';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import {
    persistCurrentMandalaViewState,
    syncCurrentMandalaDetailSidebarVisibility,
} from 'src/mandala-settings/state/current-file/mandala-view-state';
import type { PersistMandalaViewStateAction } from 'src/mandala-settings/state/settings-store-actions';
import type { Settings } from 'src/mandala-settings/state/settings-type';
import type { MandalaView } from 'src/view/view';

const createTestView = ({
    path = 'demo.md',
    isMobile = false,
    showDetailSidebar = false,
    currentPreferences = {},
}: {
    path?: string;
    isMobile?: boolean;
    showDetailSidebar?: boolean;
    currentPreferences?: Partial<
        Settings['documents'][string]['mandalaView']
    >;
} = {}) => {
    Platform.isMobile = isMobile;
    Platform.isDesktop = !isMobile;

    const dispatch = vi.fn<[PersistMandalaViewStateAction], void>();
    const viewDispatch = vi.fn();
    const settings = DEFAULT_SETTINGS();
    settings.documents[path] = {
        viewType: 'mandala-grid',
        activeSection: null,
        outline: null,
        mandalaView: {
            gridOrientation: null,
            selectedLayoutId: null,
            lastActiveSection: null,
            subgridTheme: null,
            nx9RowsPerPage: 3,
            showDetailSidebarDesktop: null,
            showDetailSidebarMobile: null,
            pinnedSections: [],
            sectionColors: {},
            ...currentPreferences,
        },
    };

    return {
        dispatch,
        viewDispatch,
        settings,
        view: {
            getCurrentFilePath: () => path,
            plugin: {
                settings: {
                    getValue: () => settings,
                    dispatch,
                },
            },
            viewStore: {
                getValue: () => ({
                    document: {
                        activeNode: 'node-1',
                    },
                    ui: {
                        mandala: {
                            showDetailSidebar,
                            subgridTheme: '2',
                        },
                    },
                }),
                dispatch: viewDispatch,
            },
            documentStore: {
                getValue: () => ({
                    meta: {
                        isMandala: true,
                    },
                    sections: {
                        id_section: {
                            'node-1': '2',
                        },
                    },
                }),
            },
        } as unknown as MandalaView,
    };
};

describe('persistCurrentMandalaViewState', () => {
    beforeEach(() => {
        Platform.isMobile = false;
        Platform.isDesktop = true;
    });

    it('persists desktop detail sidebar visibility for the current file', () => {
        const { view, dispatch } = createTestView({
            showDetailSidebar: true,
            currentPreferences: {
                showDetailSidebarDesktop: false,
                showDetailSidebarMobile: true,
            },
        });

        persistCurrentMandalaViewState(view);

        const action = dispatch.mock.calls[0]?.[0];

        expect(action.type).toBe('settings/documents/persist-mandala-view-state');
        expect(action.payload.path).toBe('demo.md');
        expect(action.payload.showDetailSidebarDesktop).toBe(true);
        expect(action.payload.showDetailSidebarMobile).toBe(true);
    });

    it('persists mobile detail sidebar visibility without overwriting desktop state', () => {
        const { view, dispatch } = createTestView({
            isMobile: true,
            showDetailSidebar: true,
            currentPreferences: {
                showDetailSidebarDesktop: false,
                showDetailSidebarMobile: null,
            },
        });

        persistCurrentMandalaViewState(view);

        const action = dispatch.mock.calls[0]?.[0];

        expect(action.type).toBe('settings/documents/persist-mandala-view-state');
        expect(action.payload.path).toBe('demo.md');
        expect(action.payload.showDetailSidebarDesktop).toBe(false);
        expect(action.payload.showDetailSidebarMobile).toBe(true);
    });

    it('skips persistence when the current file state is unchanged', () => {
        const { view, dispatch } = createTestView({
            showDetailSidebar: true,
            currentPreferences: {
                selectedLayoutId: 'builtin:left-to-right',
                gridOrientation: 'left-to-right',
                lastActiveSection: '2',
                subgridTheme: '2',
                nx9RowsPerPage: 3,
                showDetailSidebarDesktop: true,
                showDetailSidebarMobile: null,
            },
        });

        persistCurrentMandalaViewState(view);

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('persists when only detail sidebar visibility changes', () => {
        const { view, dispatch } = createTestView({
            showDetailSidebar: true,
            currentPreferences: {
                selectedLayoutId: 'builtin:left-to-right',
                gridOrientation: 'left-to-right',
                lastActiveSection: '2',
                subgridTheme: '2',
                nx9RowsPerPage: 3,
                showDetailSidebarDesktop: false,
                showDetailSidebarMobile: null,
            },
        });

        persistCurrentMandalaViewState(view);

        expect(dispatch).toHaveBeenCalledTimes(1);
        const action = dispatch.mock.calls[0]?.[0];

        expect(action.type).toBe('settings/documents/persist-mandala-view-state');
        expect(action.payload.showDetailSidebarDesktop).toBe(true);
    });
});

describe('syncCurrentMandalaDetailSidebarVisibility', () => {
    beforeEach(() => {
        Platform.isMobile = false;
        Platform.isDesktop = true;
    });

    it('restores the persisted sidebar visibility for the current file', () => {
        const { view, viewDispatch } = createTestView({
            path: 'b.md',
            showDetailSidebar: true,
            currentPreferences: {
                showDetailSidebarDesktop: false,
            },
        });

        syncCurrentMandalaDetailSidebarVisibility(view);

        expect(viewDispatch).toHaveBeenCalledWith({
            type: 'view/mandala/detail-sidebar/set',
            payload: {
                open: false,
                persistInDocument: false,
            },
        });
    });

    it('skips dispatch when the current file already matches its persisted visibility', () => {
        const { view, viewDispatch } = createTestView({
            path: 'a.md',
            showDetailSidebar: true,
            currentPreferences: {
                showDetailSidebarDesktop: true,
            },
        });

        syncCurrentMandalaDetailSidebarVisibility(view);

        expect(viewDispatch).not.toHaveBeenCalled();
    });
});
