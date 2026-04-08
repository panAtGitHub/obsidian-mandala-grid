import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Platform } from 'obsidian';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import {
    createNewFileMandalaViewStateAction,
    persistCurrentMandalaViewState,
    restoreMandalaUiState,
    syncCurrentMandalaDetailSidebarVisibility,
} from 'src/mandala-settings/state/current-file/mandala-view-state';
import type { PersistMandalaViewStateAction } from 'src/mandala-settings/state/settings-store-actions';
import type { Settings } from 'src/mandala-settings/state/settings-type';
import type { MandalaView } from 'src/view/view';

type ViewDispatchAction = {
    type: string;
    payload?: Record<string, unknown>;
};

const createTestView = ({
    path = 'demo.md',
    isMobile = false,
    showDetailSidebar = false,
    currentPreferences = {},
    globalDesktopSidebar = false,
    globalMobileSidebar = false,
    subgridMaxDepth = 'unlimited' as number | 'unlimited',
}: {
    path?: string;
    isMobile?: boolean;
    showDetailSidebar?: boolean;
    currentPreferences?: Partial<Settings['documents'][string]['mandalaView']>;
    globalDesktopSidebar?: boolean;
    globalMobileSidebar?: boolean;
    subgridMaxDepth?: number | 'unlimited';
} = {}) => {
    Platform.isMobile = isMobile;
    Platform.isDesktop = !isMobile;

    const dispatch = vi.fn<[PersistMandalaViewStateAction], void>();
    const viewDispatch = vi.fn<[ViewDispatchAction], void>();
    const settings = DEFAULT_SETTINGS();
    settings.view.showMandalaDetailSidebarDesktop = globalDesktopSidebar;
    settings.view.showMandalaDetailSidebarMobile = globalMobileSidebar;
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
            getEffectiveMandalaSettings: () => ({
                view: {
                    coreSectionMax: 'unlimited',
                    subgridMaxDepth,
                    enable9x9View: true,
                    enableNx9View: true,
                },
                general: {
                    dayPlanEnabled: true,
                    weekPlanEnabled: true,
                    weekPlanCompactMode: true,
                    weekStart: 'monday',
                    dayPlanDateHeadingFormat: 'zh-short',
                    dayPlanDateHeadingCustomTemplate: '',
                },
            }),
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

        expect(action.type).toBe(
            'settings/documents/persist-mandala-view-state',
        );
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

        expect(action.type).toBe(
            'settings/documents/persist-mandala-view-state',
        );
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

        expect(action.type).toBe(
            'settings/documents/persist-mandala-view-state',
        );
        expect(action.payload.showDetailSidebarDesktop).toBe(true);
    });
});

describe('createNewFileMandalaViewStateAction', () => {
    it('builds a file-level default action with the detail sidebar closed', () => {
        const settings = DEFAULT_SETTINGS();

        expect(
            createNewFileMandalaViewStateAction('plans/day-plan.md', settings),
        ).toEqual({
            type: 'settings/documents/persist-mandala-view-state',
            payload: {
                path: 'plans/day-plan.md',
                gridOrientation: 'left-to-right',
                selectedLayoutId: null,
                lastActiveSection: null,
                subgridTheme: null,
                showDetailSidebarDesktop: false,
                showDetailSidebarMobile: false,
            },
        });
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

    it('does not fall back to global sidebar visibility when file state is missing', () => {
        const { view, viewDispatch } = createTestView({
            path: 'c.md',
            showDetailSidebar: true,
            currentPreferences: {
                showDetailSidebarDesktop: null,
            },
            globalDesktopSidebar: true,
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
});

describe('restoreMandalaUiState', () => {
    beforeEach(() => {
        Platform.isMobile = false;
        Platform.isDesktop = true;
    });

    it('resets an invalid saved 3x3 center theme to root while keeping focus state', () => {
        const { view, viewDispatch } = createTestView({
            subgridMaxDepth: 3,
        });

        const focusTarget = {
            kind: 'node',
            nodeId: 'node-deep',
        } as const;

        restoreMandalaUiState(
            view,
            {
                subgridTheme: '1.2.2',
                focusTarget,
                weekAnchorDate: '2026-04-07',
            },
            '1.2',
        );

        expect(viewDispatch.mock.calls[0]?.[0]).toEqual({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: '1' },
        });
        expect(viewDispatch.mock.calls[1]?.[0]).toEqual({
            type: 'view/mandala/week-anchor-date/set',
            payload: { date: '2026-04-07' },
        });
        expect(viewDispatch.mock.calls[2]?.[0]).toEqual({
            type: 'view/mandala/focus-target/set',
            payload: { focusTarget },
        });
    });
});
