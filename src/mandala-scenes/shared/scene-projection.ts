import type { MandalaCardMobileDoubleClickHandler } from 'src/mandala-cell/viewmodel/controller/mandala-card-controller';
import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { Content } from 'src/mandala-document/state/document-state-type';
import type { SceneCardInteractionDescriptor } from 'src/mandala-scenes/shared/card-scene-cell';
import type { ResolvedGridStyle } from 'src/mandala-scenes/shared/grid-style';
import type { ThreeByThreeCellViewModel } from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';
import type {
    Nx9WeekCellViewModel,
} from 'src/mandala-scenes/view-nx9-week-7x9/assemble-cell-view-model';

export type SceneRendererKind =
    | 'card-scene'
    | '9x9-layout';

export type CardSceneLayoutKind = '3x3' | 'nx9' | 'nx9-week-7x9';

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
    output: {
        descriptors: ThreeByThreeCellViewModel[];
    };
    layoutMeta: {
        gridStyle: ResolvedGridStyle;
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

export type CardSceneProjection =
    | ThreeByThreeSceneProjection
    | Nx9SceneProjection
    | Nx9WeekSceneProjection;

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
