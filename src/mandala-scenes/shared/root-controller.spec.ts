import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SceneProjection } from 'src/mandala-scenes/shared/scene-projection';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';

const mocks = vi.hoisted(() => ({
    resolveProjection: vi.fn<[], SceneProjection>(),
    ensureSceneCompatibility: vi.fn(),
    cleanSceneCaches: vi.fn(),
    flushSceneSyncTrace: vi.fn(),
}));

vi.mock('src/mandala-scenes/shared/scene-controller-registry', () => ({
    createSceneControllerRegistry: () => ({
        resolve: mocks.resolveProjection,
    }),
}));

vi.mock('src/mandala-scenes/shared/scene-cache-cleanup', () => ({
    createSceneCacheCleaner: () => mocks.cleanSceneCaches,
}));

vi.mock('src/mandala-scenes/shared/scene-compatibility', () => ({
    ensureSceneCompatibility: mocks.ensureSceneCompatibility,
}));

import { createSceneRootController } from 'src/mandala-scenes/shared/root-controller';

const createDocumentState = () =>
    ({
        file: {
            frontmatter: `---
mandala: true
mandala_plan:
  enabled: true
  year: 2026
  daily_only_3x3: false
---`,
        },
        meta: {
            isMandala: true,
            mandalaV2: {
                revision: 1,
                contentRevision: 2,
            },
        },
        sections: {
            section_id: { '1': 'node-1' },
            id_section: { 'node-1': '1' },
        },
        document: {
            content: {
                'node-1': {
                    content: 'hello',
                },
            },
        },
    }) as never;

const createArgs = () => ({
    documentState: createDocumentState(),
    sceneThemeSnapshot: {
        themeTone: 'light' as const,
        themeUnderlayColor: '#fff',
        activeThemeUnderlayColor: '#eee',
    },
    committedSceneKey: {
        viewKind: '3x3' as const,
        variant: 'default' as const,
    },
    activeNodeId: 'node-1',
    editingState: {
        activeNodeId: null,
        isInSidebar: false,
    },
    selectedNodes: new Set(['node-1']),
    selectedStamp: 'node-1',
    pinnedSections: new Set(['1']),
    pinnedStamp: '1',
    sectionColors: { '1': '#111' },
    sectionColorOpacity: 60,
    backgroundMode: 'custom',
    showDetailSidebar: true,
    whiteThemeMode: false,
    subgridTheme: '1',
    nx9ActiveCell: { row: 0, col: 0, page: 0 },
    weekAnchorDate: '2026-01-01',
    selectedLayoutId: 'default',
    customLayouts: [],
    nx9RowsPerPage: 5,
    weekPlanCompactMode: false,
    weekStart: 'monday' as const,
    dayPlanEnabled: true,
    showDayPlanTodayButton: true,
    show3x3SubgridNavButtons: true,
    hasOpenOverlayModal: false,
    animateSwap: false,
    desktopSquareSize: 0,
    isMobilePopupEditing: false,
    isMobileFullScreenSearch: false,
    mode: '3x3' as const,
});

describe('root-controller', () => {
    beforeEach(() => {
        mocks.resolveProjection.mockReset();
        mocks.ensureSceneCompatibility.mockReset();
        mocks.cleanSceneCaches.mockReset();
        mocks.flushSceneSyncTrace.mockReset();
        mocks.resolveProjection.mockReturnValue({
            sceneKey: {
                viewKind: '3x3',
                variant: 'default',
            },
            rendererKind: 'card-scene',
            props: {
                layoutKind: '3x3',
                output: {
                    descriptors: [],
                },
                layoutMeta: {
                    gridStyle: resolveCardGridStyle({
                        whiteThemeMode: false,
                    }),
                    themeSnapshot: {
                        themeTone: 'light',
                        themeUnderlayColor: '#fff',
                        activeThemeUnderlayColor: '#eee',
                    },
                    theme: '1',
                    animateSwap: false,
                    show3x3SubgridNavButtons: false,
                    hasOpenOverlayModal: false,
                    enterSubgridFromButton: () => undefined,
                    exitSubgridFromButton: () => undefined,
                    getUpButtonLabel: () => '',
                    getDownButtonLabel: () => '',
                    onMobileCardDoubleClick: null,
                },
            },
        });
    });

    it('reuses the same root context object for stable inputs', () => {
        const view = {
            plugin: {
                settings: {
                    getValue: () => ({
                        general: {
                            weekPlanEnabled: true,
                        },
                    }),
                },
            },
            flushSceneSyncTrace: mocks.flushSceneSyncTrace,
        } as never;
        const controller = createSceneRootController(view);
        const args = createArgs();

        const first = controller.buildContext(args);
        const second = controller.buildContext(args);

        expect(second).toBe(first);
        expect(second.interactionSnapshot.selectedStamp).toBe('node-1');
        expect(second.interactionSnapshot.pinnedStamp).toBe('1');
    });

    it('memoizes projection resolution for the same root context', () => {
        const view = {
            plugin: {
                settings: {
                    getValue: () => ({
                        general: {
                            weekPlanEnabled: true,
                        },
                    }),
                },
            },
            flushSceneSyncTrace: mocks.flushSceneSyncTrace,
        } as never;
        const controller = createSceneRootController(view);
        const context = controller.buildContext(createArgs());

        const first = controller.resolveProjection(context);
        const second = controller.resolveProjection(context);

        expect(second).toBe(first);
        expect(mocks.resolveProjection).toHaveBeenCalledTimes(1);
        expect(mocks.ensureSceneCompatibility).toHaveBeenCalledTimes(1);
        expect(mocks.cleanSceneCaches).toHaveBeenCalledTimes(1);
        expect(mocks.flushSceneSyncTrace).toHaveBeenCalledTimes(1);
    });
});
