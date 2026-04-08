import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SceneRootContext } from 'src/mandala-scenes/shared/scene-projection';
import type { ThreeByThreeControllerCore } from 'src/mandala-scenes/view-3x3/controller';

const mocks = vi.hoisted(() => ({
    buildThreeByThreeProjectionProps: vi.fn(),
    buildThreeByThreeProjection: vi.fn(),
    buildThreeByThreeDayPlanProjectionProps: vi.fn(),
    buildThreeByThreeDayPlanProjection: vi.fn(),
    syncThreeByThreeDayPlanSceneState: vi.fn(),
    resolveThreeByThreeDayPlanTodayTargetSection: vi.fn(),
    buildNx9SceneProjection: vi.fn(),
    resolveNx9StructureContext: vi.fn(),
    resolveNx9PageContext: vi.fn(),
    setActiveCellNx9: vi.fn(),
    buildNx9WeekSceneProjection: vi.fn(),
    runtimeResolveCells: vi.fn(),
    setActiveCellNx9Week7x9: vi.fn(),
    setActiveCell9x9: vi.fn(),
    posOfSection9x9: vi.fn(),
    sectionAtCell9x9: vi.fn(),
}));

vi.mock('src/mandala-scenes/view-3x3/build-scene-projection', () => ({
    buildThreeByThreeSceneProjectionProps:
        mocks.buildThreeByThreeProjectionProps,
    buildThreeByThreeSceneProjection: mocks.buildThreeByThreeProjection,
}));

vi.mock('src/mandala-scenes/view-3x3-day-plan/build-scene-projection', () => ({
    buildThreeByThreeDayPlanSceneProjectionProps:
        mocks.buildThreeByThreeDayPlanProjectionProps,
    buildThreeByThreeDayPlanSceneProjection:
        mocks.buildThreeByThreeDayPlanProjection,
}));

vi.mock('src/mandala-scenes/view-3x3-day-plan/scene-state', () => ({
    focusThreeByThreeDayPlanTodayFromButton: vi.fn(),
    resolveThreeByThreeDayPlanTodayTargetSection:
        mocks.resolveThreeByThreeDayPlanTodayTargetSection,
    syncThreeByThreeDayPlanSceneState:
        mocks.syncThreeByThreeDayPlanSceneState,
}));

vi.mock('src/mandala-scenes/view-nx9/build-scene-projection', () => ({
    buildNx9SceneProjection: mocks.buildNx9SceneProjection,
}));

vi.mock('src/mandala-scenes/view-nx9/context', () => ({
    normalizeNx9VisibleSection: (section: string | undefined) => section ?? null,
}));

vi.mock('src/mandala-scenes/view-nx9/context-runtime', () => ({
    createNx9ContextRuntime: () => ({
        resolveStructureContext: mocks.resolveNx9StructureContext,
        resolvePageContext: mocks.resolveNx9PageContext,
    }),
}));

vi.mock('src/mandala-scenes/view-nx9/set-active-cell', () => ({
    setActiveCellNx9: mocks.setActiveCellNx9,
}));

vi.mock('src/mandala-scenes/view-nx9-week-7x9/build-scene-projection', () => ({
    buildNx9WeekSceneProjection: mocks.buildNx9WeekSceneProjection,
}));

vi.mock('src/mandala-scenes/view-nx9-week-7x9/runtime', () => ({
    createNx9WeekRuntime: () => ({
        resolveCells: mocks.runtimeResolveCells,
    }),
}));

vi.mock('src/mandala-scenes/view-nx9-week-7x9/set-active-cell', () => ({
    setActiveCellNx9Week7x9: mocks.setActiveCellNx9Week7x9,
}));

vi.mock('src/mandala-interaction/helpers/set-active-cell-9x9', () => ({
    setActiveCell9x9: mocks.setActiveCell9x9,
}));

vi.mock('src/mandala-display/logic/mandala-grid', () => ({
    posOfSection9x9: mocks.posOfSection9x9,
    sectionAtCell9x9: mocks.sectionAtCell9x9,
}));

import { createThreeByThreeController } from 'src/mandala-scenes/view-3x3/controller';
import { createThreeByThreeDayPlanController } from 'src/mandala-scenes/view-3x3-day-plan/controller';
import { createNx9Controller } from 'src/mandala-scenes/view-nx9/controller';
import { createNx9WeekController } from 'src/mandala-scenes/view-nx9-week-7x9/controller';
import { createNineByNineController } from 'src/mandala-scenes/view-9x9/controller';
import type {
    Nx9SceneProjection,
    Nx9WeekSceneProjection,
    ThreeByThreeDayPlanSceneProjection,
    ThreeByThreeSceneProjection,
} from 'src/mandala-scenes/shared/scene-projection';
import type { ThreeByThreeCellViewModel } from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';

const createContext = (
    overrides: Partial<SceneRootContext> = {},
): SceneRootContext =>
    ({
        view: {
            mandalaActiveCellNx9: {
                row: 0,
                col: 0,
                page: 0,
            },
            mandalaActiveCell9x9: null,
            viewStore: {
                dispatch: vi.fn(),
            },
        },
        sceneKey: {
            viewKind: '3x3',
            variant: 'default',
        },
        committedSceneKey: {
            viewKind: '3x3',
            variant: 'default',
        },
        documentState: {
            sections: {
                section_id: { '1': 'node-1' },
                id_section: { 'node-1': '1' },
            },
            document: {
                content: {},
            },
            file: {
                frontmatter: '',
            },
        } as never,
        documentSnapshot: {
            revision: 1,
            contentRevision: 1,
            sectionIdMap: { '1': 'node-1' },
            documentContent: {},
        },
        displaySnapshot: {
            sectionColors: {},
            sectionColorOpacity: 100,
            backgroundMode: 'default',
            showDetailSidebar: false,
            whiteThemeMode: false,
        },
        interactionSnapshot: {
            activeNodeId: 'node-1',
            editingState: {
                activeNodeId: null,
                isInSidebar: false,
            },
            selectedNodes: new Set<string>(),
            pinnedSections: new Set<string>(),
            showDetailSidebar: false,
            selectedStamp: '',
            pinnedStamp: '',
        },
        sceneThemeSnapshot: {
            themeTone: 'light',
            themeUnderlayColor: '#fff',
            activeThemeUnderlayColor: '#eee',
        },
        topology: {} as never,
        sectionToNodeId: { '1': 'node-1' },
        idToSection: { 'node-1': '1' },
        dayPlan: null,
        dayPlanTodayNavigation: null as never,
        weekContext: {
            anchorDate: '2026-01-01',
            posForSection: vi.fn(() => ({
                row: 0,
                col: 0,
            })),
            sectionForCell: vi.fn(() => '1'),
        } as never,
        gridStyles: {
            threeByThree: {
                cacheKey: '3x3',
            },
            nx9: {
                cacheKey: 'nx9',
            },
            week: {
                cacheKey: 'week',
            },
        } as never,
        settings: {
            selectedLayoutId: 'default',
            customLayouts: [],
            nx9RowsPerPage: 7,
            weekPlanCompactMode: false,
            weekStart: 'monday',
            dayPlanEnabled: true,
            showDayPlanTodayButton: true,
            show3x3SubgridNavButtons: true,
        },
        ui: {
            activeNodeId: 'node-1',
            activeSection: '1',
            activeCoreSection: '1',
            subgridTheme: '1',
            nx9ActiveCell: {
                row: 0,
                col: 0,
                page: 0,
            },
            weekAnchorDate: '2026-01-01',
            animateSwap: false,
            hasOpenOverlayModal: false,
            desktopSquareSize: 0,
            isMobilePopupEditing: false,
            isMobileFullScreenSearch: false,
        },
        lifecycle: {
            ensureCompatibility: () => undefined,
            cleanSceneCaches: () => undefined,
            flushSceneSyncTrace: () => undefined,
        },
        ...overrides,
    }) as SceneRootContext;

describe('scene-controllers', () => {
    beforeEach(() => {
        mocks.buildThreeByThreeProjectionProps.mockReset();
        mocks.buildThreeByThreeProjection.mockReset();
        mocks.buildThreeByThreeDayPlanProjectionProps.mockReset();
        mocks.buildThreeByThreeDayPlanProjection.mockReset();
        mocks.syncThreeByThreeDayPlanSceneState.mockReset();
        mocks.resolveThreeByThreeDayPlanTodayTargetSection.mockReset();
        mocks.buildNx9SceneProjection.mockReset();
        mocks.resolveNx9StructureContext.mockReset();
        mocks.resolveNx9PageContext.mockReset();
        mocks.setActiveCellNx9.mockReset();
        mocks.buildNx9WeekSceneProjection.mockReset();
        mocks.runtimeResolveCells.mockReset();
        mocks.setActiveCellNx9Week7x9.mockReset();
        mocks.setActiveCell9x9.mockReset();
        mocks.posOfSection9x9.mockReset();
        mocks.sectionAtCell9x9.mockReset();

        mocks.buildThreeByThreeProjectionProps.mockReturnValue({
            layoutKind: '3x3',
            output: {
                descriptors: [],
            },
            layoutMeta: {
                theme: '1',
            },
        });
        mocks.buildThreeByThreeProjection.mockImplementation(
            ({
                sceneKey,
                preparedProps,
            }: {
                sceneKey: SceneRootContext['sceneKey'];
                preparedProps: ThreeByThreeSceneProjection['props'];
            }) => ({
                sceneKey,
                rendererKind: 'card-scene',
                props: preparedProps,
            }),
        );
        mocks.buildThreeByThreeDayPlanProjectionProps.mockReturnValue({
            layoutKind: '3x3-day-plan',
            output: {
                descriptors: [],
            },
            layoutMeta: {
                dayPlanTodayTargetSection: '1',
            },
        });
        mocks.buildThreeByThreeDayPlanProjection.mockImplementation(
            ({
                sceneKey,
                preparedProps,
            }: {
                sceneKey: SceneRootContext['sceneKey'];
                preparedProps: ThreeByThreeDayPlanSceneProjection['props'];
            }) => ({
                sceneKey,
                rendererKind: 'card-scene',
                props: preparedProps,
            }),
        );
        mocks.syncThreeByThreeDayPlanSceneState.mockReturnValue('1');
        mocks.resolveThreeByThreeDayPlanTodayTargetSection.mockReturnValue('1');
        mocks.buildNx9SceneProjection.mockImplementation(
            (
                sceneKey: SceneRootContext['sceneKey'],
                props: Nx9SceneProjection['props'],
            ) => ({
                sceneKey,
                rendererKind: 'card-scene',
                props,
            }),
        );
        mocks.resolveNx9StructureContext.mockReturnValue({
            posForSection: () => ({
                row: 0,
                col: 0,
                page: 0,
            }),
        });
        mocks.resolveNx9PageContext.mockReturnValue({
            posForSection: () => ({
                row: 0,
                col: 0,
                page: 0,
            }),
            sectionForCell: () => '1',
            isGhostCreateCell: () => false,
        });
        mocks.runtimeResolveCells.mockReturnValue([]);
        mocks.buildNx9WeekSceneProjection.mockImplementation(
            (
                sceneKey: SceneRootContext['sceneKey'],
                props: Nx9WeekSceneProjection['props'],
            ) => ({
                sceneKey,
                rendererKind: 'card-scene',
                props,
            }),
        );
        mocks.posOfSection9x9.mockReturnValue({ row: 1, col: 4 });
        mocks.sectionAtCell9x9.mockReturnValue('1');
    });

    it('memoizes the 3x3 controller projection around a stable core state', () => {
        const cells = [] as ThreeByThreeCellViewModel[];
        const core: ThreeByThreeControllerCore = {
            resolveState: vi.fn(() => ({
                cells,
                theme: '1',
            })),
            syncDefaultSceneState: vi.fn(),
            enterSubgridFromButton: vi.fn(),
            exitSubgridFromButton: vi.fn(),
            onMobileCardDoubleClick: vi.fn(),
            getUpButtonLabel: vi.fn(() => '退出上一层子九宫格'),
            getDownButtonLabel: vi.fn(() => '进入下一层子九宫格'),
        };
        const controller = createThreeByThreeController({} as never, core);
        const context = createContext();

        const first = controller.resolveProjection(context);
        const second = controller.resolveProjection(context);

        expect(first).toBe(second);
        expect(core.syncDefaultSceneState).toHaveBeenCalledTimes(2);
        expect(mocks.buildThreeByThreeProjectionProps).toHaveBeenCalledTimes(1);
        expect(mocks.buildThreeByThreeProjection).toHaveBeenCalledTimes(1);
    });

    it('builds the day-plan controller committed projection from scene-local sync state', () => {
        const core: ThreeByThreeControllerCore = {
            resolveState: vi.fn(() => ({
                cells: [],
                theme: '1',
            })),
            syncDefaultSceneState: vi.fn(),
            enterSubgridFromButton: vi.fn(),
            exitSubgridFromButton: vi.fn(),
            onMobileCardDoubleClick: vi.fn(),
            getUpButtonLabel: vi.fn(() => '退出上一层子九宫格'),
            getDownButtonLabel: vi.fn(() => '进入下一层子九宫格'),
        };
        const controller = createThreeByThreeDayPlanController(
            {
                viewStore: {
                    dispatch: vi.fn(),
                },
            } as never,
            core,
        );
        const context = createContext({
            sceneKey: {
                viewKind: '3x3',
                variant: 'day-plan',
            },
            committedSceneKey: {
                viewKind: '3x3',
                variant: 'day-plan',
            },
        });

        const projection = controller.resolveProjection(context);

        expect(mocks.syncThreeByThreeDayPlanSceneState).toHaveBeenCalledTimes(1);
        expect(
            mocks.buildThreeByThreeDayPlanProjectionProps,
        ).toHaveBeenCalledTimes(1);
        expect(mocks.buildThreeByThreeDayPlanProjectionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                enterSubgridFromButton: core.enterSubgridFromButton,
                exitSubgridFromButton: core.exitSubgridFromButton,
                onMobileCardDoubleClick: core.onMobileCardDoubleClick,
            }),
        );
        expect(projection.props.layoutKind).toBe('3x3-day-plan');
    });

    it('resolves nx9 projections from the current scene context only once for stable inputs', () => {
        const controller = createNx9Controller();
        const context = createContext({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
            committedSceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
        });

        const first = controller.resolveProjection(context);
        const second = controller.resolveProjection(context);

        expect(first).toBe(second);
        expect(mocks.resolveNx9StructureContext).toHaveBeenCalledTimes(2);
        expect(mocks.resolveNx9PageContext).toHaveBeenCalledTimes(2);
        expect(mocks.buildNx9SceneProjection).toHaveBeenCalledTimes(1);
        expect(mocks.setActiveCellNx9).not.toHaveBeenCalled();
    });

    it('keeps a virtual nx9 child cell selected when the mapped section has no node yet', () => {
        const controller = createNx9Controller();
        const context = createContext({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
            committedSceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
            documentSnapshot: {
                revision: 1,
                contentRevision: 1,
                sectionIdMap: { '1': 'node-1' },
                documentContent: {},
            },
            ui: {
                ...createContext().ui,
                activeSection: '1',
                activeCoreSection: '1',
                nx9ActiveCell: {
                    row: 0,
                    col: 3,
                    page: 0,
                },
            },
            view: {
                mandalaActiveCellNx9: {
                    row: 0,
                    col: 3,
                    page: 0,
                },
                viewStore: {
                    dispatch: vi.fn(),
                },
            } as never,
        });

        mocks.resolveNx9PageContext.mockReturnValueOnce({
            posForSection: () => ({
                row: 0,
                col: 0,
                page: 0,
            }),
            sectionForCell: () => '1.3',
            isGhostCreateCell: () => false,
        });

        controller.resolveProjection(context);

        expect(mocks.setActiveCellNx9).not.toHaveBeenCalled();
    });

    it('keeps week projection assembly inside the week controller and runtime', () => {
        const controller = createNx9WeekController();
        const dispatch = vi.fn();
        const context = createContext({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            committedSceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            ui: {
                ...createContext().ui,
                weekAnchorDate: null,
            },
            view: {
                mandalaActiveCellNx9: {
                    row: 0,
                    col: 0,
                    page: 0,
                },
                viewStore: {
                    dispatch,
                },
            } as never,
        });

        controller.resolveProjection(context);

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(mocks.runtimeResolveCells).toHaveBeenCalledTimes(1);
        expect(mocks.buildNx9WeekSceneProjection).toHaveBeenCalledTimes(1);
    });

    it('wraps the legacy 9x9 renderer behind a stable controller projection', () => {
        const controller = createNineByNineController();
        const context = createContext({
            sceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            committedSceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            view: {
                mandalaActiveCell9x9: null,
            } as never,
        });

        const first = controller.resolveProjection(context);
        const second = controller.resolveProjection(context);

        expect(first).toBe(second);
        expect(first.rendererKind).toBe('9x9-layout');
        expect(mocks.setActiveCell9x9).toHaveBeenCalledWith(context.view, {
            row: 1,
            col: 4,
        });
    });

    it('re-canonicalizes duplicated 9x9 active cells back to the unique focus cell', () => {
        const controller = createNineByNineController();
        const context = createContext({
            sceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            committedSceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            idToSection: { 'node-1': '1.2' },
            ui: {
                ...createContext().ui,
                activeNodeId: 'node-1',
                activeSection: '1.2',
                activeCoreSection: '1',
            },
            view: {
                mandalaActiveCell9x9: {
                    row: 4,
                    col: 1,
                },
                viewStore: {
                    dispatch: vi.fn(),
                },
            } as never,
        });

        controller.resolveProjection(context);

        expect(mocks.setActiveCell9x9).toHaveBeenCalledWith(context.view, {
            row: 1,
            col: 4,
        });
    });

    it('keeps the current 9x9 cell when it already maps to the active section', () => {
        const controller = createNineByNineController();
        mocks.sectionAtCell9x9.mockReturnValue('1.2');
        const context = createContext({
            sceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            committedSceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            idToSection: { 'node-1': '1.2' },
            ui: {
                ...createContext().ui,
                activeNodeId: 'node-1',
                activeSection: '1.2',
                activeCoreSection: '1',
            },
            view: {
                mandalaActiveCell9x9: {
                    row: 4,
                    col: 1,
                },
                viewStore: {
                    dispatch: vi.fn(),
                },
            } as never,
        });

        controller.resolveProjection(context);

        expect(mocks.setActiveCell9x9).not.toHaveBeenCalled();
    });

    it('keeps the current 9x9 cell when mapped section has no node yet', () => {
        const controller = createNineByNineController();
        mocks.sectionAtCell9x9.mockReturnValue('1.7.2');
        const context = createContext({
            sceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            committedSceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            idToSection: { 'node-1': '1.7' },
            sectionToNodeId: {
                '1.7': 'node-1',
            },
            ui: {
                ...createContext().ui,
                activeNodeId: 'node-1',
                activeSection: '1.7',
                activeCoreSection: '1',
            },
            view: {
                mandalaActiveCell9x9: {
                    row: 4,
                    col: 5,
                },
                viewStore: {
                    dispatch: vi.fn(),
                },
            } as never,
        });

        controller.resolveProjection(context);

        expect(mocks.setActiveCell9x9).not.toHaveBeenCalled();
    });
});
