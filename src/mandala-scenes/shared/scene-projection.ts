import type { MandalaCardMobileDoubleClickHandler } from 'src/mandala-cell/viewmodel/controller/mandala-card-controller';
import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import type {
    DayPlanFrontmatter,
} from 'src/mandala-display/logic/day-plan';
import type {
    DayPlanTodayNavigation,
    MandalaSceneKey,
} from 'src/mandala-display/logic/mandala-profile';
import type { WeekPlanContext } from 'src/mandala-display/logic/week-plan-context';
import type {
    Content,
    DocumentState,
} from 'src/mandala-document/state/document-state-type';
import type { MandalaTopologyIndex } from 'src/mandala-display/logic/mandala-topology';
import type { SceneCardInteractionDescriptor } from 'src/mandala-scenes/shared/card-scene-cell';
import type { ResolvedGridStyle } from 'src/mandala-scenes/shared/grid-style';
import type { ThreeByThreeCellViewModel } from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';
import type { Nx9WeekCellViewModel } from 'src/mandala-scenes/view-nx9-week-7x9/assemble-cell-view-model';
import type {
    MandalaCustomLayout,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';
import type { MandalaView } from 'src/view/view';

export type SceneRendererKind = 'card-scene' | '9x9-layout';

export type CardSceneLayoutKind =
    | '3x3'
    | '3x3-day-plan'
    | 'nx9'
    | 'nx9-week-7x9';

export type SceneDocumentSnapshot = {
    revision: number;
    contentRevision: number;
    sectionIdMap: Record<string, string>;
    documentContent: Content;
};

export type SceneDisplaySnapshot = {
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    backgroundMode: string;
    showDetailSidebar: boolean;
    whiteThemeMode: boolean;
};

export type SceneEditingSnapshot = {
    activeNodeId: string | null;
    isInSidebar: boolean;
};

export type SceneCardInteractionSnapshot = SceneCardInteractionDescriptor & {
    selectedStamp: string;
    pinnedStamp: string;
};

type ThreeByThreeLayoutMeta = {
    gridStyle: ResolvedGridStyle;
    themeSnapshot: MandalaThemeSnapshot;
    theme: string;
    animateSwap: boolean;
    show3x3SubgridNavButtons: boolean;
    hasOpenOverlayModal: boolean;
    enterSubgridFromButton: (event: MouseEvent, nodeId: string) => void;
    exitSubgridFromButton: (event: MouseEvent) => void;
    getUpButtonLabel: (theme: string) => string;
    getDownButtonLabel: (theme: string) => string;
    onMobileCardDoubleClick: MandalaCardMobileDoubleClickHandler | null;
};

export type ThreeByThreeSceneProjectionProps = {
    layoutKind: '3x3';
    output: {
        descriptors: ThreeByThreeCellViewModel[];
    };
    layoutMeta: ThreeByThreeLayoutMeta;
};

export type ThreeByThreeDayPlanSceneProjectionProps = {
    layoutKind: '3x3-day-plan';
    output: {
        descriptors: ThreeByThreeCellViewModel[];
    };
    layoutMeta: ThreeByThreeLayoutMeta & {
        dayPlanEnabled: boolean;
        showDayPlanTodayButton: boolean;
        dayPlanTodayTargetSection: string | null;
        activeCoreSection: string | null;
        todayButtonLabel: string;
        focusDayPlanTodayFromButton: (event: MouseEvent) => void;
    };
};

export type NineByNineSceneProjection = {
    sceneKey: MandalaSceneKey;
    rendererKind: '9x9-layout';
    props: Record<string, never>;
};

export type Nx9SceneProjection = {
    sceneKey: MandalaSceneKey;
    rendererKind: 'card-scene';
    props: {
        layoutKind: 'nx9';
        output: Record<string, never>;
        layoutMeta: {
            documentSnapshot: SceneDocumentSnapshot;
            themeSnapshot: MandalaThemeSnapshot;
            gridStyle: ResolvedGridStyle;
            rowsPerPage: number;
            displaySnapshot: SceneDisplaySnapshot;
            interactionSnapshot: SceneCardInteractionSnapshot;
            activeSection: string | null;
            activeCoreSection: string | null;
            activeCell: { row: number; col: number; page?: number } | null;
        };
    };
};

export type Nx9WeekSceneProjectionProps = {
    layoutKind: 'nx9-week-7x9';
    output: {
        descriptors: Nx9WeekCellViewModel[];
    };
    layoutMeta: {
        displaySnapshot: SceneDisplaySnapshot;
        gridStyle: ResolvedGridStyle;
        themeSnapshot: MandalaThemeSnapshot;
    };
};

export type Nx9WeekSceneProjection = {
    sceneKey: MandalaSceneKey;
    rendererKind: 'card-scene';
    props: Nx9WeekSceneProjectionProps;
};

export type ThreeByThreeSceneProjection = {
    sceneKey: MandalaSceneKey;
    rendererKind: 'card-scene';
    props: ThreeByThreeSceneProjectionProps;
};

export type ThreeByThreeDayPlanSceneProjection = {
    sceneKey: MandalaSceneKey;
    rendererKind: 'card-scene';
    props: ThreeByThreeDayPlanSceneProjectionProps;
};

export type CardSceneProjection =
    | ThreeByThreeSceneProjection
    | ThreeByThreeDayPlanSceneProjection
    | Nx9SceneProjection
    | Nx9WeekSceneProjection;

export type SceneProjection = CardSceneProjection | NineByNineSceneProjection;

export type SceneLifecycle = {
    ensureCompatibility: () => void;
    cleanSceneCaches: () => void;
    flushSceneSyncTrace: () => void;
};

export type SceneRootGridStyles = {
    threeByThree: ResolvedGridStyle;
    nx9: ResolvedGridStyle;
    week: ResolvedGridStyle;
};

export type SceneRootSettings = {
    selectedLayoutId: string;
    customLayouts: MandalaCustomLayout[];
    nx9RowsPerPage: number;
    weekPlanCompactMode: boolean;
    weekStart: WeekStart;
    dayPlanEnabled: boolean;
    showDayPlanTodayButton: boolean;
    show3x3SubgridNavButtons: boolean;
};

export type SceneRootUiState = {
    activeNodeId: string | null;
    activeSection: string | null;
    activeCoreSection: string | null;
    subgridTheme: string | null | undefined;
    nx9ActiveCell: { row: number; col: number; page?: number } | null;
    weekAnchorDate: string | null | undefined;
    animateSwap: boolean;
    hasOpenOverlayModal: boolean;
    desktopSquareSize: number;
    isMobilePopupEditing: boolean;
    isMobileFullScreenSearch: boolean;
};

export type SceneRootContext = {
    view: MandalaView;
    sceneKey: MandalaSceneKey;
    committedSceneKey: MandalaSceneKey;
    documentState: DocumentState;
    documentSnapshot: SceneDocumentSnapshot;
    displaySnapshot: SceneDisplaySnapshot;
    interactionSnapshot: SceneCardInteractionSnapshot;
    sceneThemeSnapshot: MandalaThemeSnapshot;
    topology: MandalaTopologyIndex;
    sectionToNodeId: Record<string, string | undefined>;
    idToSection: Record<string, string | undefined>;
    dayPlan: DayPlanFrontmatter | null;
    dayPlanTodayNavigation: DayPlanTodayNavigation;
    weekContext: WeekPlanContext;
    gridStyles: SceneRootGridStyles;
    settings: SceneRootSettings;
    ui: SceneRootUiState;
    lifecycle: SceneLifecycle;
};

export type SceneController = {
    resolveProjection: (context: SceneRootContext) => SceneProjection;
};

export type SceneRootShellProps = {
    sceneKey: MandalaSceneKey;
    committedSceneKey: MandalaSceneKey;
    projection: SceneProjection;
};

export const sceneKeyEquals = (a: MandalaSceneKey, b: MandalaSceneKey) =>
    a.viewKind === b.viewKind && a.variant === b.variant;

export const shouldUseCommittedSceneProjection = (
    sceneKey: MandalaSceneKey,
    committedSceneKey: MandalaSceneKey,
) =>
    sceneKey.viewKind === '3x3' &&
    committedSceneKey.viewKind === '3x3' &&
    sceneKeyEquals(sceneKey, committedSceneKey);

export const getSceneKeyId = (sceneKey: MandalaSceneKey) =>
    `${sceneKey.viewKind}:${sceneKey.variant}` as const;

export const resolveSceneRendererKind = (
    sceneKey: MandalaSceneKey,
): SceneRendererKind => {
    if (sceneKey.viewKind === '9x9') {
        return '9x9-layout';
    }
    return 'card-scene';
};
