import type {
    SceneController,
    SceneRootContext,
    ThreeByThreeSceneProjection,
} from 'src/mandala-scenes/shared/scene-projection';
import { buildThreeByThreeSceneProjection } from 'src/mandala-scenes/view-3x3/build-scene-projection';
import {
    enterThreeByThreeSubgridFromButton,
    exitThreeByThreeSubgridFromButton,
    getThreeByThreeDownButtonLabel,
    getThreeByThreeUpButtonLabel,
    handleThreeByThreeMobileCardDoubleClick,
    resolveThreeByThreeTheme,
    syncThreeByThreeSceneState,
} from 'src/mandala-scenes/view-3x3/scene-state';
import { createThreeByThreeRuntime } from 'src/mandala-scenes/view-3x3/runtime';
import type { MandalaView } from 'src/view/view';
import { buildThreeByThreeSceneProjectionProps } from 'src/mandala-scenes/view-3x3/build-scene-projection';

type SharedThreeByThreeState = {
    cells: ReturnType<ReturnType<typeof createThreeByThreeRuntime>['resolveCells']>;
    theme: string;
};

export type ThreeByThreeControllerCore = {
    resolveState: (context: SceneRootContext) => SharedThreeByThreeState;
    syncDefaultSceneState: (context: SceneRootContext) => void;
    enterSubgridFromButton: (event: MouseEvent, nodeId: string) => void;
    exitSubgridFromButton: (event: MouseEvent) => void;
    onMobileCardDoubleClick: Parameters<
        Exclude<
            ReturnType<
                typeof buildThreeByThreeSceneProjectionProps
            >['layoutMeta']['onMobileCardDoubleClick'],
            null
        >
    >[0] extends infer Payload
        ? (payload: Payload) => void
        : never;
    getUpButtonLabel: typeof getThreeByThreeUpButtonLabel;
    getDownButtonLabel: typeof getThreeByThreeDownButtonLabel;
};

export const createThreeByThreeControllerCore = (
    view: MandalaView,
): ThreeByThreeControllerCore => {
    const runtime = createThreeByThreeRuntime();
    const enterSubgridFromButton = (event: MouseEvent, nodeId: string) =>
        enterThreeByThreeSubgridFromButton(view, event, nodeId);
    const exitSubgridFromButton = (event: MouseEvent) =>
        exitThreeByThreeSubgridFromButton(view, event);
    const onMobileCardDoubleClick = ({
        nodeId,
        displaySection,
        event,
    }: {
        nodeId: string;
        displaySection: string;
        event: MouseEvent;
    }) =>
        handleThreeByThreeMobileCardDoubleClick(
            view,
            event,
            nodeId,
            displaySection,
        );

    let cachedTheme: string | null = null;
    let cachedCells: SharedThreeByThreeState['cells'] = [];
    let cachedTopology: SceneRootContext['topology'] | null = null;
    let cachedLayoutId = '';
    let cachedCustomLayouts: SceneRootContext['settings']['customLayouts'] | null =
        null;
    let cachedInteraction: SceneRootContext['interactionSnapshot'] | null = null;
    let cachedDisplay: SceneRootContext['displaySnapshot'] | null = null;
    let cachedGridStyle: SceneRootContext['gridStyles']['threeByThree'] | null =
        null;
    let cachedSubgridTheme: string | null | undefined = null;

    return {
        resolveState: (context) => {
            const theme = resolveThreeByThreeTheme(context.ui.subgridTheme);
            if (
                cachedTheme === theme &&
                cachedTopology === context.topology &&
                cachedLayoutId === context.settings.selectedLayoutId &&
                cachedCustomLayouts === context.settings.customLayouts &&
                cachedInteraction === context.interactionSnapshot &&
                cachedDisplay === context.displaySnapshot &&
                cachedGridStyle === context.gridStyles.threeByThree &&
                cachedSubgridTheme === context.ui.subgridTheme
            ) {
                return {
                    cells: cachedCells,
                    theme,
                };
            }

            cachedCells = runtime.resolveCells({
                theme,
                selectedLayoutId: context.settings.selectedLayoutId,
                customLayouts: context.settings.customLayouts,
                topology: context.topology,
                interaction: context.interactionSnapshot,
                gridStyle: context.gridStyles.threeByThree,
                displaySnapshot: context.displaySnapshot,
            });
            cachedTheme = theme;
            cachedTopology = context.topology;
            cachedLayoutId = context.settings.selectedLayoutId;
            cachedCustomLayouts = context.settings.customLayouts;
            cachedInteraction = context.interactionSnapshot;
            cachedDisplay = context.displaySnapshot;
            cachedGridStyle = context.gridStyles.threeByThree;
            cachedSubgridTheme = context.ui.subgridTheme;
            return {
                cells: cachedCells,
                theme,
            };
        },
        syncDefaultSceneState: (context) => {
            syncThreeByThreeSceneState({
                view: context.view,
                mode: context.sceneKey.viewKind,
                subgridTheme: context.ui.subgridTheme,
                documentState: context.documentState,
                sectionToNodeId: context.sectionToNodeId,
            });
        },
        enterSubgridFromButton,
        exitSubgridFromButton,
        onMobileCardDoubleClick,
        getUpButtonLabel: getThreeByThreeUpButtonLabel,
        getDownButtonLabel: getThreeByThreeDownButtonLabel,
    };
};

export const createThreeByThreeController = (
    view: MandalaView,
    core = createThreeByThreeControllerCore(view),
): SceneController => {
    let cachedProjection: ThreeByThreeSceneProjection | null = null;
    let cachedCells: SharedThreeByThreeState['cells'] = [];
    let cachedTheme = '';
    let cachedThemeSnapshot: SceneRootContext['sceneThemeSnapshot'] | null = null;
    let cachedGridStyle: SceneRootContext['gridStyles']['threeByThree'] | null =
        null;
    let cachedAnimateSwap = false;
    let cachedShowNavButtons = false;
    let cachedHasOpenOverlayModal = false;
    let cachedSceneKeyId = '';
    let cachedCommittedSceneKeyId = '';

    return {
        resolveProjection: (context) => {
            core.syncDefaultSceneState(context);
            const { cells, theme } = core.resolveState(context);
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
                cachedHasOpenOverlayModal === context.ui.hasOpenOverlayModal
            ) {
                return cachedProjection;
            }

            const props = buildThreeByThreeSceneProjectionProps({
                cells,
                gridStyle: context.gridStyles.threeByThree,
                themeSnapshot: context.sceneThemeSnapshot,
                theme,
                animateSwap: context.ui.animateSwap,
                show3x3SubgridNavButtons:
                    context.settings.show3x3SubgridNavButtons,
                hasOpenOverlayModal: context.ui.hasOpenOverlayModal,
                enterSubgridFromButton: core.enterSubgridFromButton,
                exitSubgridFromButton: core.exitSubgridFromButton,
                onMobileCardDoubleClick: core.onMobileCardDoubleClick,
                getUpButtonLabel: core.getUpButtonLabel,
                getDownButtonLabel: core.getDownButtonLabel,
            });
            cachedProjection = buildThreeByThreeSceneProjection({
                sceneKey: context.sceneKey,
                committedSceneKey: context.committedSceneKey,
                preparedProps: props,
                committedProps: props,
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
            return cachedProjection;
        },
    };
};
