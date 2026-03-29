import {
    parseDayPlanFrontmatter,
} from 'src/mandala-display/logic/day-plan';
import {
    resolveDayPlanTodayNavigation,
    resolveMandalaSceneKey,
} from 'src/mandala-display/logic/mandala-profile';
import {
    resolveWeekPlanContext,
} from 'src/mandala-display/logic/week-plan-context';
import { buildMandalaTopologyIndex } from 'src/mandala-display/logic/mandala-topology';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';
import { buildSceneInputSnapshots } from 'src/mandala-scenes/shared/scene-input-runtime';
import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import type {
    SceneProjection,
    SceneRootContext,
} from 'src/mandala-scenes/shared/scene-projection';
import { createSceneControllerRegistry } from 'src/mandala-scenes/shared/scene-controller-registry';
import { createSceneCacheCleaner } from 'src/mandala-scenes/shared/scene-cache-cleanup';
import { ensureSceneCompatibility } from 'src/mandala-scenes/shared/scene-compatibility';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import type {
    MandalaCustomLayout,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';
import type { MandalaMode } from 'src/mandala-settings/state/settings-type';
import type { MandalaView } from 'src/view/view';

type BuildSceneRootContextArgs = {
    documentState: DocumentState;
    sceneThemeSnapshot: MandalaThemeSnapshot;
    committedSceneKey: SceneRootContext['committedSceneKey'];
    activeNodeId: string | null;
    editingState: SceneRootContext['interactionSnapshot']['editingState'];
    selectedNodes: Set<string>;
    selectedStamp: string;
    pinnedSections: Set<string>;
    pinnedStamp: string;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    backgroundMode: string;
    showDetailSidebar: boolean;
    whiteThemeMode: boolean;
    subgridTheme: string | null | undefined;
    nx9ActiveCell: { row: number; col: number; page?: number } | null;
    weekAnchorDate: string | null | undefined;
    selectedLayoutId: string;
    customLayouts: MandalaCustomLayout[];
    nx9RowsPerPage: number;
    weekPlanCompactMode: boolean;
    weekStart: WeekStart;
    dayPlanEnabled: boolean;
    showDayPlanTodayButton: boolean;
    show3x3SubgridNavButtons: boolean;
    hasOpenOverlayModal: boolean;
    animateSwap: boolean;
    desktopSquareSize: number;
    isMobilePopupEditing: boolean;
    isMobileFullScreenSearch: boolean;
    mode: MandalaMode;
};

export const createSceneRootController = (view: MandalaView) => {
    const cleanSceneCaches = createSceneCacheCleaner();
    const controllerRegistry = createSceneControllerRegistry(view);
    let cachedContext: SceneRootContext | null = null;
    let cachedArgs: BuildSceneRootContextArgs | null = null;
    let cachedProjectionContext: SceneRootContext | null = null;
    let cachedProjection: SceneProjection | null = null;

    const buildContext = (args: BuildSceneRootContextArgs): SceneRootContext => {
        if (
            cachedContext &&
            cachedArgs &&
            cachedArgs.documentState === args.documentState &&
            cachedArgs.sceneThemeSnapshot === args.sceneThemeSnapshot &&
            cachedArgs.committedSceneKey === args.committedSceneKey &&
            cachedArgs.activeNodeId === args.activeNodeId &&
            cachedArgs.editingState === args.editingState &&
            cachedArgs.selectedNodes === args.selectedNodes &&
            cachedArgs.selectedStamp === args.selectedStamp &&
            cachedArgs.pinnedSections === args.pinnedSections &&
            cachedArgs.pinnedStamp === args.pinnedStamp &&
            cachedArgs.sectionColors === args.sectionColors &&
            cachedArgs.sectionColorOpacity === args.sectionColorOpacity &&
            cachedArgs.backgroundMode === args.backgroundMode &&
            cachedArgs.showDetailSidebar === args.showDetailSidebar &&
            cachedArgs.whiteThemeMode === args.whiteThemeMode &&
            cachedArgs.subgridTheme === args.subgridTheme &&
            cachedArgs.nx9ActiveCell === args.nx9ActiveCell &&
            cachedArgs.weekAnchorDate === args.weekAnchorDate &&
            cachedArgs.selectedLayoutId === args.selectedLayoutId &&
            cachedArgs.customLayouts === args.customLayouts &&
            cachedArgs.nx9RowsPerPage === args.nx9RowsPerPage &&
            cachedArgs.weekPlanCompactMode === args.weekPlanCompactMode &&
            cachedArgs.weekStart === args.weekStart &&
            cachedArgs.dayPlanEnabled === args.dayPlanEnabled &&
            cachedArgs.showDayPlanTodayButton ===
                args.showDayPlanTodayButton &&
            cachedArgs.show3x3SubgridNavButtons ===
                args.show3x3SubgridNavButtons &&
            cachedArgs.hasOpenOverlayModal === args.hasOpenOverlayModal &&
            cachedArgs.animateSwap === args.animateSwap &&
            cachedArgs.desktopSquareSize === args.desktopSquareSize &&
            cachedArgs.isMobilePopupEditing === args.isMobilePopupEditing &&
            cachedArgs.isMobileFullScreenSearch ===
                args.isMobileFullScreenSearch &&
            cachedArgs.mode === args.mode
        ) {
            return cachedContext;
        }

        const sectionToNodeId = args.documentState.sections.section_id;
        const idToSection = args.documentState.sections.id_section;
        const activeSection = args.activeNodeId
            ? idToSection[args.activeNodeId] ?? null
            : null;
        const activeCoreSection = activeSection?.split('.')[0] ?? null;
        const sceneKey = resolveMandalaSceneKey({
            frontmatter: args.documentState.file.frontmatter,
            viewKind: args.mode,
            weekPlanEnabled:
                view.plugin.settings.getValue().general.weekPlanEnabled,
        });
        const sceneInputSnapshots = buildSceneInputSnapshots({
            documentState: args.documentState,
            sectionColors: args.sectionColors,
            sectionColorOpacity: args.sectionColorOpacity,
            backgroundMode: args.backgroundMode,
            showDetailSidebar: args.showDetailSidebar,
            whiteThemeMode: args.whiteThemeMode,
            activeNodeId: args.activeNodeId,
            editingState: args.editingState,
            selectedNodes: args.selectedNodes,
            selectedStamp: args.selectedStamp,
            pinnedSections: args.pinnedSections,
            pinnedStamp: args.pinnedStamp,
        });
        const dayPlan = parseDayPlanFrontmatter(
            args.documentState.file.frontmatter,
        );
        const weekContext = resolveWeekPlanContext({
            frontmatter: args.documentState.file.frontmatter,
            anchorDate: args.weekAnchorDate,
            weekStart: args.weekStart,
        });
        const nextContext: SceneRootContext = {
            view,
            sceneKey,
            committedSceneKey: args.committedSceneKey,
            documentState: args.documentState,
            documentSnapshot: sceneInputSnapshots.documentSnapshot,
            displaySnapshot: sceneInputSnapshots.displaySnapshot,
            interactionSnapshot: sceneInputSnapshots.interactionSnapshot,
            sceneThemeSnapshot: args.sceneThemeSnapshot,
            topology: buildMandalaTopologyIndex(sectionToNodeId),
            sectionToNodeId,
            idToSection,
            dayPlan,
            dayPlanTodayNavigation: resolveDayPlanTodayNavigation(
                args.documentState.file.frontmatter,
            ),
            weekContext,
            gridStyles: {
                threeByThree: resolveCardGridStyle({
                    whiteThemeMode:
                        sceneInputSnapshots.displaySnapshot.whiteThemeMode,
                }),
                nx9: resolveCardGridStyle({
                    whiteThemeMode:
                        sceneInputSnapshots.displaySnapshot.whiteThemeMode,
                }),
                week: resolveCardGridStyle({
                    whiteThemeMode:
                        sceneInputSnapshots.displaySnapshot.whiteThemeMode,
                    compactMode: args.weekPlanCompactMode,
                }),
            },
            settings: {
                selectedLayoutId: args.selectedLayoutId,
                customLayouts: args.customLayouts,
                nx9RowsPerPage: args.nx9RowsPerPage,
                weekPlanCompactMode: args.weekPlanCompactMode,
                weekStart: args.weekStart,
                dayPlanEnabled: args.dayPlanEnabled,
                showDayPlanTodayButton: args.showDayPlanTodayButton,
                show3x3SubgridNavButtons: args.show3x3SubgridNavButtons,
            },
            ui: {
                activeNodeId: args.activeNodeId,
                activeSection,
                activeCoreSection,
                subgridTheme: args.subgridTheme,
                nx9ActiveCell: args.nx9ActiveCell,
                weekAnchorDate: args.weekAnchorDate,
                animateSwap: args.animateSwap,
                hasOpenOverlayModal: args.hasOpenOverlayModal,
                desktopSquareSize: args.desktopSquareSize,
                isMobilePopupEditing: args.isMobilePopupEditing,
                isMobileFullScreenSearch: args.isMobileFullScreenSearch,
            },
            lifecycle: {
                ensureCompatibility: () =>
                    ensureSceneCompatibility(view, {
                        sceneKey,
                        dayPlanEnabled: args.dayPlanEnabled,
                        subgridTheme: args.subgridTheme,
                        sectionToNodeId,
                        documentState: args.documentState,
                    }),
                cleanSceneCaches: () =>
                    cleanSceneCaches(view, args.committedSceneKey),
                flushSceneSyncTrace: () =>
                    view.flushSceneSyncTrace({
                        mode: sceneKey.viewKind,
                    }),
            },
        };

        cachedArgs = args;
        cachedContext = nextContext;
        return nextContext;
    };

    return {
        buildContext,
        resolveProjection: (context: SceneRootContext) => {
            if (cachedProjection && cachedProjectionContext === context) {
                return cachedProjection;
            }

            context.lifecycle.ensureCompatibility();
            context.lifecycle.cleanSceneCaches();
            const projection = controllerRegistry.resolve(context);
            context.lifecycle.flushSceneSyncTrace();
            cachedProjectionContext = context;
            cachedProjection = projection;
            return projection;
        },
    };
};
