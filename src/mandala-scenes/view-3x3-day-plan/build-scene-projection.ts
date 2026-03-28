import type { MandalaCardMobileDoubleClickHandler } from 'src/mandala-cell/viewmodel/controller/mandala-card-controller';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import { lang } from 'src/lang/lang';
import type { ResolvedGridStyle } from 'src/mandala-scenes/shared/grid-style';
import {
    shouldUseCommittedSceneProjection,
    type ThreeByThreeDayPlanSceneProjection,
    type ThreeByThreeDayPlanSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';
import type { ThreeByThreeCellViewModel } from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';

export const buildThreeByThreeDayPlanSceneProjectionProps = ({
    cells,
    gridStyle,
    themeSnapshot,
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
    gridStyle: ResolvedGridStyle;
    themeSnapshot: MandalaThemeSnapshot;
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
}): ThreeByThreeDayPlanSceneProjectionProps => ({
    layoutKind: '3x3-day-plan',
    output: {
        descriptors: cells,
    },
    layoutMeta: {
        gridStyle,
        themeSnapshot,
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
    },
});

export const buildThreeByThreeDayPlanSceneProjection = ({
    sceneKey,
    committedSceneKey,
    preparedProps,
    committedProps,
}: {
    sceneKey: MandalaSceneKey;
    committedSceneKey: MandalaSceneKey;
    preparedProps: ThreeByThreeDayPlanSceneProjectionProps;
    committedProps: ThreeByThreeDayPlanSceneProjectionProps;
}): ThreeByThreeDayPlanSceneProjection => ({
    sceneKey,
    rendererKind: 'card-scene',
    props: shouldUseCommittedSceneProjection(sceneKey, committedSceneKey)
        ? committedProps
        : preparedProps,
});
