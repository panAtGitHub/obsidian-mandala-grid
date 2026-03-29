import type {
    SceneController,
    SceneRootContext,
    ThreeByThreeDayPlanSceneProjection,
} from 'src/mandala-scenes/shared/scene-projection';
import { buildThreeByThreeDayPlanSceneProjection } from 'src/mandala-scenes/view-3x3-day-plan/build-scene-projection';
import {
    focusThreeByThreeDayPlanTodayFromButton,
    resolveThreeByThreeDayPlanTodayTargetSection,
    syncThreeByThreeDayPlanSceneState,
} from 'src/mandala-scenes/view-3x3-day-plan/scene-state';
import {
    createThreeByThreeControllerCore,
    type ThreeByThreeControllerCore,
} from 'src/mandala-scenes/view-3x3/controller';
import { buildThreeByThreeDayPlanSceneProjectionProps } from 'src/mandala-scenes/view-3x3-day-plan/build-scene-projection';
import type { MandalaView } from 'src/view/view';

export const createThreeByThreeDayPlanController = (
    view: MandalaView,
    core: ThreeByThreeControllerCore = createThreeByThreeControllerCore(view),
): SceneController => {
    const focusDayPlanToday = (event: MouseEvent) =>
        focusThreeByThreeDayPlanTodayFromButton(view, event);

    let cachedProjection: ThreeByThreeDayPlanSceneProjection | null = null;
    let cachedCells: ReturnType<ThreeByThreeControllerCore['resolveState']>['cells'] =
        [];
    let cachedTheme = '';
    let cachedThemeSnapshot: SceneRootContext['sceneThemeSnapshot'] | null = null;
    let cachedGridStyle: SceneRootContext['gridStyles']['threeByThree'] | null =
        null;
    let cachedAnimateSwap = false;
    let cachedShowNavButtons = false;
    let cachedHasOpenOverlayModal = false;
    let cachedDayPlanEnabled = false;
    let cachedShowTodayButton = false;
    let cachedTodayTarget: string | null = null;
    let cachedActiveCoreSection: string | null = null;
    let cachedSceneKeyId = '';
    let cachedCommittedSceneKeyId = '';

    return {
        resolveProjection: (context) => {
            const dayPlanTodayTargetSection =
                syncThreeByThreeDayPlanSceneState({
                    view: context.view,
                    mode: context.sceneKey.viewKind,
                    subgridTheme: context.ui.subgridTheme,
                    documentState: context.documentState,
                    sectionToNodeId: context.sectionToNodeId,
                    dayPlan: context.dayPlan,
                    dayPlanTodayNavigation: context.dayPlanTodayNavigation,
                });
            const { cells, theme } = core.resolveState(context);
            const preparedTargetSection =
                resolveThreeByThreeDayPlanTodayTargetSection(
                    context.dayPlanTodayNavigation,
                );
            const nextSceneKeyId = `${context.sceneKey.viewKind}:${context.sceneKey.variant}`;
            const nextCommittedSceneKeyId = `${context.committedSceneKey.viewKind}:${context.committedSceneKey.variant}`;

            if (
                cachedProjection &&
                cachedSceneKeyId === nextSceneKeyId &&
                cachedCommittedSceneKeyId === nextCommittedSceneKeyId &&
                cachedCells === cells &&
                cachedTheme === theme &&
                cachedThemeSnapshot === context.sceneThemeSnapshot &&
                cachedGridStyle === context.gridStyles.threeByThree &&
                cachedAnimateSwap === context.ui.animateSwap &&
                cachedShowNavButtons ===
                    context.settings.show3x3SubgridNavButtons &&
                cachedHasOpenOverlayModal === context.ui.hasOpenOverlayModal &&
                cachedDayPlanEnabled === context.settings.dayPlanEnabled &&
                cachedShowTodayButton ===
                    context.settings.showDayPlanTodayButton &&
                cachedTodayTarget === preparedTargetSection &&
                cachedActiveCoreSection === context.ui.activeCoreSection &&
                dayPlanTodayTargetSection === preparedTargetSection
            ) {
                return cachedProjection;
            }

            const props = buildThreeByThreeDayPlanSceneProjectionProps({
                cells,
                gridStyle: context.gridStyles.threeByThree,
                themeSnapshot: context.sceneThemeSnapshot,
                theme,
                animateSwap: context.ui.animateSwap,
                show3x3SubgridNavButtons:
                    context.settings.show3x3SubgridNavButtons,
                hasOpenOverlayModal: context.ui.hasOpenOverlayModal,
                dayPlanEnabled: context.settings.dayPlanEnabled,
                showDayPlanTodayButton:
                    context.settings.showDayPlanTodayButton,
                dayPlanTodayTargetSection: preparedTargetSection,
                activeCoreSection: context.ui.activeCoreSection,
                enterSubgridFromButton: core.enterSubgridFromButton,
                exitSubgridFromButton: core.exitSubgridFromButton,
                focusDayPlanTodayFromButton: focusDayPlanToday,
                onMobileCardDoubleClick: core.onMobileCardDoubleClick,
                getUpButtonLabel: core.getUpButtonLabel,
                getDownButtonLabel: core.getDownButtonLabel,
            });
            cachedProjection = buildThreeByThreeDayPlanSceneProjection({
                sceneKey: context.sceneKey,
                committedSceneKey: context.committedSceneKey,
                preparedProps: props,
                committedProps: {
                    ...props,
                    layoutMeta: {
                        ...props.layoutMeta,
                        dayPlanTodayTargetSection,
                    },
                },
            });
            cachedSceneKeyId = nextSceneKeyId;
            cachedCommittedSceneKeyId = nextCommittedSceneKeyId;
            cachedCells = cells;
            cachedTheme = theme;
            cachedThemeSnapshot = context.sceneThemeSnapshot;
            cachedGridStyle = context.gridStyles.threeByThree;
            cachedAnimateSwap = context.ui.animateSwap;
            cachedShowNavButtons =
                context.settings.show3x3SubgridNavButtons;
            cachedHasOpenOverlayModal = context.ui.hasOpenOverlayModal;
            cachedDayPlanEnabled = context.settings.dayPlanEnabled;
            cachedShowTodayButton =
                context.settings.showDayPlanTodayButton;
            cachedTodayTarget = preparedTargetSection;
            cachedActiveCoreSection = context.ui.activeCoreSection;
            return cachedProjection;
        },
    };
};
