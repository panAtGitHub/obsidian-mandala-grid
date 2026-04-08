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

type SceneFacts = {
    sceneKey: SceneRootContext['sceneKey'];
    sectionToNodeId: SceneRootContext['sectionToNodeId'];
    idToSection: SceneRootContext['idToSection'];
    activeSection: string | null;
    activeCoreSection: string | null;
};

type SceneSnapshots = Pick<
    SceneRootContext,
    'documentSnapshot' | 'displaySnapshot' | 'interactionSnapshot'
>;

type SceneDerivedDisplay = Pick<
    SceneRootContext,
    'dayPlan' | 'dayPlanTodayNavigation' | 'weekContext' | 'topology' | 'gridStyles'
>;

type DocumentCacheRefs = {
    frontmatter: string;
    revision: number;
    contentRevision: number;
    sectionToNodeId: DocumentState['sections']['section_id'];
    idToSection: DocumentState['sections']['id_section'];
    documentContent: DocumentState['document']['content'];
};

export const createSceneRootController = (view: MandalaView) => {
    const cleanSceneCaches = createSceneCacheCleaner();
    const controllerRegistry = createSceneControllerRegistry(view);
    let cachedFacts: SceneFacts | null = null;
    let cachedFactsArgs:
        | (Pick<BuildSceneRootContextArgs, 'activeNodeId' | 'mode'> &
              Pick<
                  DocumentCacheRefs,
                  'frontmatter' | 'sectionToNodeId' | 'idToSection'
              >)
        | null = null;
    let cachedSnapshots: SceneSnapshots | null = null;
    let cachedSnapshotArgs:
        | (Pick<
              BuildSceneRootContextArgs,
              | 'sectionColors'
              | 'sectionColorOpacity'
              | 'backgroundMode'
              | 'showDetailSidebar'
              | 'whiteThemeMode'
              | 'activeNodeId'
              | 'editingState'
              | 'selectedNodes'
              | 'selectedStamp'
              | 'pinnedSections'
              | 'pinnedStamp'
          > &
              Pick<
                  DocumentCacheRefs,
                  | 'revision'
                  | 'contentRevision'
                  | 'sectionToNodeId'
                  | 'documentContent'
              >)
        | null = null;
    let cachedDerivedDisplay: SceneDerivedDisplay | null = null;
    let cachedDerivedArgs:
        | {
              frontmatter: string;
              weekAnchorDate: string | null | undefined;
              weekStart: WeekStart;
              weekPlanCompactMode: boolean;
              displaySnapshot: SceneRootContext['displaySnapshot'];
              sectionToNodeId: SceneRootContext['sectionToNodeId'];
          }
        | null = null;
    let cachedContext: SceneRootContext | null = null;
    let cachedContextDeps:
        | {
              facts: SceneFacts;
              snapshots: SceneSnapshots;
              derivedDisplay: SceneDerivedDisplay;
              sceneThemeSnapshot: BuildSceneRootContextArgs['sceneThemeSnapshot'];
              committedSceneKey: BuildSceneRootContextArgs['committedSceneKey'];
              selectedLayoutId: string;
              customLayouts: BuildSceneRootContextArgs['customLayouts'];
              nx9RowsPerPage: number;
              weekPlanCompactMode: boolean;
              weekStart: WeekStart;
              dayPlanEnabled: boolean;
              showDayPlanTodayButton: boolean;
              show3x3SubgridNavButtons: boolean;
              uiKey: string;
          }
        | null = null;
    let cachedProjectionContext: SceneRootContext | null = null;
    let cachedProjection: SceneProjection | null = null;

    const resolveDocumentCacheRefs = (
        args: BuildSceneRootContextArgs,
    ): DocumentCacheRefs => ({
        frontmatter: args.documentState.file.frontmatter,
        revision: args.documentState.meta.mandalaV2.revision,
        contentRevision: args.documentState.meta.mandalaV2.contentRevision,
        sectionToNodeId: args.documentState.sections.section_id,
        idToSection: args.documentState.sections.id_section,
        documentContent: args.documentState.document.content,
    });

    const resolveSceneFacts = (args: BuildSceneRootContextArgs) => {
        const documentRefs = resolveDocumentCacheRefs(args);
        if (
            cachedFacts &&
            cachedFactsArgs &&
            cachedFactsArgs.frontmatter === documentRefs.frontmatter &&
            cachedFactsArgs.sectionToNodeId === documentRefs.sectionToNodeId &&
            cachedFactsArgs.idToSection === documentRefs.idToSection &&
            cachedFactsArgs.activeNodeId === args.activeNodeId &&
            cachedFactsArgs.mode === args.mode
        ) {
            return cachedFacts;
        }

        const { frontmatter, sectionToNodeId, idToSection } = documentRefs;
        const activeSection = args.activeNodeId
            ? idToSection[args.activeNodeId] ?? null
            : null;
        const activeCoreSection = activeSection?.split('.')[0] ?? null;
        const effective = view.getEffectiveMandalaSettings();
        const nextFacts = {
            sceneKey: resolveMandalaSceneKey({
                frontmatter,
                viewKind: args.mode,
                weekPlanEnabled: effective.general.weekPlanEnabled,
            }),
            sectionToNodeId,
            idToSection,
            activeSection,
            activeCoreSection,
        };
        cachedFactsArgs = {
            frontmatter,
            sectionToNodeId,
            idToSection,
            activeNodeId: args.activeNodeId,
            mode: args.mode,
        };
        cachedFacts = nextFacts;
        return nextFacts;
    };

    const resolveSceneSnapshots = (args: BuildSceneRootContextArgs) => {
        const documentRefs = resolveDocumentCacheRefs(args);
        if (
            cachedSnapshots &&
            cachedSnapshotArgs &&
            cachedSnapshotArgs.revision === documentRefs.revision &&
            cachedSnapshotArgs.contentRevision ===
                documentRefs.contentRevision &&
            cachedSnapshotArgs.sectionToNodeId === documentRefs.sectionToNodeId &&
            cachedSnapshotArgs.documentContent === documentRefs.documentContent &&
            cachedSnapshotArgs.sectionColors === args.sectionColors &&
            cachedSnapshotArgs.sectionColorOpacity === args.sectionColorOpacity &&
            cachedSnapshotArgs.backgroundMode === args.backgroundMode &&
            cachedSnapshotArgs.showDetailSidebar === args.showDetailSidebar &&
            cachedSnapshotArgs.whiteThemeMode === args.whiteThemeMode &&
            cachedSnapshotArgs.activeNodeId === args.activeNodeId &&
            cachedSnapshotArgs.editingState === args.editingState &&
            cachedSnapshotArgs.selectedNodes === args.selectedNodes &&
            cachedSnapshotArgs.selectedStamp === args.selectedStamp &&
            cachedSnapshotArgs.pinnedSections === args.pinnedSections &&
            cachedSnapshotArgs.pinnedStamp === args.pinnedStamp
        ) {
            return cachedSnapshots;
        }

        const nextSnapshots = buildSceneInputSnapshots({
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
        cachedSnapshotArgs = {
            revision: documentRefs.revision,
            contentRevision: documentRefs.contentRevision,
            sectionToNodeId: documentRefs.sectionToNodeId,
            documentContent: documentRefs.documentContent,
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
        };
        cachedSnapshots = nextSnapshots;
        return nextSnapshots;
    };

    const resolveSceneDerivedDisplay = ({
        args,
        facts,
        snapshots,
    }: {
        args: BuildSceneRootContextArgs;
        facts: NonNullable<typeof cachedFacts>;
        snapshots: NonNullable<typeof cachedSnapshots>;
    }) => {
        const frontmatter = args.documentState.file.frontmatter;
        if (
            cachedDerivedDisplay &&
            cachedDerivedArgs &&
            cachedDerivedArgs.frontmatter === frontmatter &&
            cachedDerivedArgs.weekAnchorDate === args.weekAnchorDate &&
            cachedDerivedArgs.weekStart === args.weekStart &&
            cachedDerivedArgs.weekPlanCompactMode === args.weekPlanCompactMode &&
            cachedDerivedArgs.displaySnapshot === snapshots.displaySnapshot &&
            cachedDerivedArgs.sectionToNodeId === facts.sectionToNodeId
        ) {
            return cachedDerivedDisplay;
        }

        const baseGridStyle = resolveCardGridStyle({
            whiteThemeMode: snapshots.displaySnapshot.whiteThemeMode,
        });
        const nextDerivedDisplay = {
            dayPlan: parseDayPlanFrontmatter(frontmatter),
            dayPlanTodayNavigation: resolveDayPlanTodayNavigation(frontmatter),
            weekContext: resolveWeekPlanContext({
                frontmatter,
                anchorDate: args.weekAnchorDate,
                weekStart: args.weekStart,
            }),
            topology: buildMandalaTopologyIndex(facts.sectionToNodeId),
            gridStyles: {
                threeByThree: baseGridStyle,
                nx9: baseGridStyle,
                week: resolveCardGridStyle({
                    whiteThemeMode: snapshots.displaySnapshot.whiteThemeMode,
                    compactMode: args.weekPlanCompactMode,
                }),
            },
        };
        cachedDerivedArgs = {
            frontmatter,
            weekAnchorDate: args.weekAnchorDate,
            weekStart: args.weekStart,
            weekPlanCompactMode: args.weekPlanCompactMode,
            displaySnapshot: snapshots.displaySnapshot,
            sectionToNodeId: facts.sectionToNodeId,
        };
        cachedDerivedDisplay = nextDerivedDisplay;
        return nextDerivedDisplay;
    };

    const buildContext = (args: BuildSceneRootContextArgs): SceneRootContext => {
        const facts = resolveSceneFacts(args);
        const sceneInputSnapshots = resolveSceneSnapshots(args);
        const derivedDisplay = resolveSceneDerivedDisplay({
            args,
            facts,
            snapshots: sceneInputSnapshots,
        });
        const uiKey = [
            args.activeNodeId ?? '',
            args.subgridTheme ?? '',
            args.nx9ActiveCell?.row ?? '',
            args.nx9ActiveCell?.col ?? '',
            args.nx9ActiveCell?.page ?? '',
            args.weekAnchorDate ?? '',
            args.animateSwap ? 'animate' : 'static',
            args.hasOpenOverlayModal ? 'overlay' : 'clear',
            args.desktopSquareSize,
            args.isMobilePopupEditing ? 'mobile-editor' : 'no-mobile-editor',
            args.isMobileFullScreenSearch ? 'mobile-search' : 'no-mobile-search',
        ].join('|');
        if (
            cachedContext &&
            cachedContextDeps &&
            cachedContextDeps.facts === facts &&
            cachedContextDeps.snapshots === sceneInputSnapshots &&
            cachedContextDeps.derivedDisplay === derivedDisplay &&
            cachedContextDeps.sceneThemeSnapshot === args.sceneThemeSnapshot &&
            cachedContextDeps.committedSceneKey === args.committedSceneKey &&
            cachedContextDeps.selectedLayoutId === args.selectedLayoutId &&
            cachedContextDeps.customLayouts === args.customLayouts &&
            cachedContextDeps.nx9RowsPerPage === args.nx9RowsPerPage &&
            cachedContextDeps.weekPlanCompactMode === args.weekPlanCompactMode &&
            cachedContextDeps.weekStart === args.weekStart &&
            cachedContextDeps.dayPlanEnabled === args.dayPlanEnabled &&
            cachedContextDeps.showDayPlanTodayButton ===
                args.showDayPlanTodayButton &&
            cachedContextDeps.show3x3SubgridNavButtons ===
                args.show3x3SubgridNavButtons &&
            cachedContextDeps.uiKey === uiKey
        ) {
            return cachedContext;
        }

        const nextContext: SceneRootContext = {
            view,
            sceneKey: facts.sceneKey,
            committedSceneKey: args.committedSceneKey,
            documentState: args.documentState,
            documentSnapshot: sceneInputSnapshots.documentSnapshot,
            displaySnapshot: sceneInputSnapshots.displaySnapshot,
            interactionSnapshot: sceneInputSnapshots.interactionSnapshot,
            sceneThemeSnapshot: args.sceneThemeSnapshot,
            topology: derivedDisplay.topology,
            sectionToNodeId: facts.sectionToNodeId,
            idToSection: facts.idToSection,
            dayPlan: derivedDisplay.dayPlan,
            dayPlanTodayNavigation: derivedDisplay.dayPlanTodayNavigation,
            weekContext: derivedDisplay.weekContext,
            gridStyles: derivedDisplay.gridStyles,
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
                activeSection: facts.activeSection,
                activeCoreSection: facts.activeCoreSection,
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
                        sceneKey: facts.sceneKey,
                        dayPlanEnabled: args.dayPlanEnabled,
                        subgridTheme: args.subgridTheme,
                        sectionToNodeId: facts.sectionToNodeId,
                        documentState: args.documentState,
                    }),
                cleanSceneCaches: () =>
                    cleanSceneCaches(view, args.committedSceneKey),
                flushSceneSyncTrace: () =>
                    view.flushSceneSyncTrace({
                        mode: facts.sceneKey.viewKind,
                    }),
            },
        };

        cachedContext = nextContext;
        cachedContextDeps = {
            facts,
            snapshots: sceneInputSnapshots,
            derivedDisplay,
            sceneThemeSnapshot: args.sceneThemeSnapshot,
            committedSceneKey: args.committedSceneKey,
            selectedLayoutId: args.selectedLayoutId,
            customLayouts: args.customLayouts,
            nx9RowsPerPage: args.nx9RowsPerPage,
            weekPlanCompactMode: args.weekPlanCompactMode,
            weekStart: args.weekStart,
            dayPlanEnabled: args.dayPlanEnabled,
            showDayPlanTodayButton: args.showDayPlanTodayButton,
            show3x3SubgridNavButtons: args.show3x3SubgridNavButtons,
            uiKey,
        };
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
