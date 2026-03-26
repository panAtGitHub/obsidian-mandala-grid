import type { MandalaCardMobileDoubleClickHandler } from 'src/mandala-cell/viewmodel/controller/mandala-card-controller';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { ThreeByThreeCellViewModel } from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';

export type SceneRendererKind =
    | '3x3-layout'
    | '9x9-layout'
    | 'nx9-layout'
    | 'week-layout';

export type ThreeByThreeSceneProjectionProps = {
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

export type ThreeByThreeSceneProjection = {
    sceneKey: MandalaSceneKey;
    rendererKind: '3x3-layout';
    props: ThreeByThreeSceneProjectionProps;
};

export type NineByNineSceneProjection = {
    sceneKey: MandalaSceneKey;
    rendererKind: '9x9-layout';
    props: Record<string, never>;
};

export type Nx9SceneProjection = {
    sceneKey: MandalaSceneKey;
    rendererKind: 'nx9-layout';
    props: Record<string, never>;
};

export type WeekSceneProjection = {
    sceneKey: MandalaSceneKey;
    rendererKind: 'week-layout';
    props: Record<string, never>;
};

export type SceneProjection =
    | ThreeByThreeSceneProjection
    | NineByNineSceneProjection
    | Nx9SceneProjection
    | WeekSceneProjection;

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
    if (sceneKey.viewKind === '3x3') {
        return '3x3-layout';
    }
    if (sceneKey.viewKind === '9x9') {
        return '9x9-layout';
    }
    if (sceneKey.variant === 'week-7x9') {
        return 'week-layout';
    }
    return 'nx9-layout';
};
