import type { MandalaCardMobileDoubleClickHandler } from 'src/mandala-cell/viewmodel/controller/mandala-card-controller';
import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { Content } from 'src/mandala-document/state/document-state-type';
import type { WeekPlanRow } from 'src/mandala-display/logic/day-plan';
import type { SceneCardInteractionDescriptor } from 'src/mandala-scenes/shared/card-scene-cell';
import type { ThreeByThreeCellViewModel } from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';
import type {
    WeekPlanDesktopCellViewModel,
    WeekPlanMobileCellViewModel,
} from 'src/mandala-scenes/view-7x9/assemble-cell-view-model';

export type SceneRendererKind =
    | 'card-scene'
    | '9x9-layout';

export type CardSceneLayoutKind = '3x3' | 'week' | 'nx9';

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

export type ThreeByThreeSceneProjectionProps = {
    layoutKind: '3x3';
    cells: ThreeByThreeCellViewModel[];
    theme: string;
    animateSwap: boolean;
    show3x3SubgridNavButtons: boolean;
    hasOpenOverlayModal: boolean;
    dayPlanEnabled: boolean;
    showDayPlanTodayButton: boolean;
    dayPlanTodayTargetSection: string | null;
    activeCoreSection: string | null;
    todayButtonLabel: string;
    enterSubgridFromButton: (event: MouseEvent, nodeId: string) => void;
    exitSubgridFromButton: (event: MouseEvent) => void;
    focusDayPlanTodayFromButton: (event: MouseEvent) => void;
    getUpButtonLabel: (theme: string) => string;
    getDownButtonLabel: (theme: string) => string;
    onMobileCardDoubleClick: MandalaCardMobileDoubleClickHandler | null;
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
        documentSnapshot: SceneDocumentSnapshot;
        themeSnapshot: MandalaThemeSnapshot;
        rowsPerPage: number;
        displaySnapshot: SceneDisplaySnapshot;
        interactionSnapshot: SceneCardInteractionSnapshot;
        activeSection: string | null;
        activeCoreSection: string | null;
        activeCell: { row: number; col: number; page?: number } | null;
    };
};

export type WeekSceneProjectionProps = {
    layoutKind: 'week';
    rows: WeekPlanRow[];
    desktopCells: WeekPlanDesktopCellViewModel[];
    mobileCells: WeekPlanMobileCellViewModel[];
    compactMode: boolean;
    displaySnapshot: SceneDisplaySnapshot;
};

export type WeekSceneProjection = {
    sceneKey: MandalaSceneKey;
    rendererKind: 'card-scene';
    props: WeekSceneProjectionProps;
};

export type ThreeByThreeSceneProjection = {
    sceneKey: MandalaSceneKey;
    rendererKind: 'card-scene';
    props: ThreeByThreeSceneProjectionProps;
};

export type CardSceneProjection =
    | ThreeByThreeSceneProjection
    | Nx9SceneProjection
    | WeekSceneProjection;

export type SceneProjection =
    | CardSceneProjection
    | NineByNineSceneProjection
;

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
