import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import {
    shouldUseCommittedSceneProjection,
    type SceneProjection,
    type ThreeByThreeSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';
import type { MandalaCardMobileDoubleClickHandler } from 'src/mandala-cell/viewmodel/controller/mandala-card-controller';
import { lang } from 'src/lang/lang';
import type { ThreeByThreeCellViewModel } from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';

export const buildThreeByThreeSceneProjectionProps = ({
    cells,
    theme,
    animateSwap,
    show3x3SubgridNavButtons,
    hasOpenOverlayModal,
    dayPlanEnabled,
    showDayPlanTodayButton,
    dayPlanTodayTargetSection,
    activeCoreSection,
    enterSubgridFromButton,
    exitSubgridFromButton,
    focusDayPlanTodayFromButton,
    onMobileCardDoubleClick,
    getUpButtonLabel,
    getDownButtonLabel,
}: {
    cells: ThreeByThreeCellViewModel[];
    theme: string;
    animateSwap: boolean;
    show3x3SubgridNavButtons: boolean;
    hasOpenOverlayModal: boolean;
    dayPlanEnabled: boolean;
    showDayPlanTodayButton: boolean;
    dayPlanTodayTargetSection: string | null;
    activeCoreSection: string | null;
    enterSubgridFromButton: (event: MouseEvent, nodeId: string) => void;
    exitSubgridFromButton: (event: MouseEvent) => void;
    focusDayPlanTodayFromButton: (event: MouseEvent) => void;
    onMobileCardDoubleClick: MandalaCardMobileDoubleClickHandler | null;
    getUpButtonLabel: (theme: string) => string;
    getDownButtonLabel: (theme: string) => string;
}): ThreeByThreeSceneProjectionProps => ({
    layoutKind: '3x3',
    cells,
    theme,
    animateSwap,
    show3x3SubgridNavButtons,
    hasOpenOverlayModal,
    dayPlanEnabled,
    showDayPlanTodayButton,
    dayPlanTodayTargetSection,
    activeCoreSection,
    todayButtonLabel: lang.day_plan_today_button_label,
    enterSubgridFromButton,
    exitSubgridFromButton,
    focusDayPlanTodayFromButton,
    onMobileCardDoubleClick,
    getUpButtonLabel,
    getDownButtonLabel,
});

export const buildThreeByThreeSceneProjection = ({
    sceneKey,
    committedSceneKey,
    preparedProps,
    committedProps,
}: {
    sceneKey: MandalaSceneKey;
    committedSceneKey: MandalaSceneKey;
    preparedProps: ThreeByThreeSceneProjectionProps;
    committedProps: ThreeByThreeSceneProjectionProps;
}): SceneProjection => ({
    sceneKey,
    rendererKind: 'card-scene',
    props: shouldUseCommittedSceneProjection(sceneKey, committedSceneKey)
        ? committedProps
        : preparedProps,
});
