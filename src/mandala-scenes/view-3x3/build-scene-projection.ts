import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import {
    shouldUseCommittedSceneProjection,
    type ThreeByThreeSceneProjection,
    type ThreeByThreeSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';
import type { MandalaCardMobileDoubleClickHandler } from 'src/mandala-cell/viewmodel/controller/mandala-card-controller';
import type { ResolvedGridStyle } from 'src/mandala-scenes/shared/grid-style';
import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import type { ThreeByThreeCellViewModel } from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';

export const buildThreeByThreeSceneProjectionProps = ({
    cells,
    gridStyle,
    themeSnapshot,
    theme,
    animateSwap,
    show3x3SubgridNavButtons,
    hasOpenOverlayModal,
    enterSubgridFromButton,
    exitSubgridFromButton,
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
    enterSubgridFromButton: (event: MouseEvent, nodeId: string) => void;
    exitSubgridFromButton: (event: MouseEvent) => void;
    onMobileCardDoubleClick: MandalaCardMobileDoubleClickHandler | null;
    getUpButtonLabel: (theme: string) => string;
    getDownButtonLabel: (theme: string) => string;
}): ThreeByThreeSceneProjectionProps => ({
    layoutKind: '3x3',
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
        enterSubgridFromButton,
        exitSubgridFromButton,
        onMobileCardDoubleClick,
        getUpButtonLabel,
        getDownButtonLabel,
    },
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
}): ThreeByThreeSceneProjection => ({
    sceneKey,
    rendererKind: 'card-scene',
    props: shouldUseCommittedSceneProjection(sceneKey, committedSceneKey)
        ? committedProps
        : preparedProps,
});
