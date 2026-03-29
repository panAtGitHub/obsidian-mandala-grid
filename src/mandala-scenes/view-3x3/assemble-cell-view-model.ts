import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import type { MandalaTopologyIndex } from 'src/mandala-display/logic/mandala-topology';
import { getSectionNodeId } from 'src/mandala-display/logic/mandala-topology';
import type { MandalaCustomLayout } from 'src/mandala-settings/state/settings-type';
import { getMandalaLayoutById } from 'src/mandala-display/logic/mandala-grid';
import { resolveSectionSurfaceVisual } from 'src/mandala-display/contrast/section-surface-visual';
import {
    buildSceneCardCellList,
    createSceneCardCellSeed,
    type SceneCardInteractionDescriptor,
    type SceneCardCellDescriptorList,
    type SceneCardCellFrame,
    type SceneCardCellViewModel,
} from 'src/mandala-scenes/shared/card-scene-cell';
import type { ResolvedGridStyle } from 'src/mandala-scenes/shared/grid-style';
import type { SceneDisplaySnapshot } from 'src/mandala-scenes/shared/scene-projection';

export type Assemble3x3CellViewModelsArgs = {
    theme: string;
    selectedLayoutId: string | null;
    customLayouts: MandalaCustomLayout[];
    topology: MandalaTopologyIndex;
    interaction: SceneCardInteractionDescriptor;
    gridStyle: ResolvedGridStyle;
    displaySnapshot: SceneDisplaySnapshot;
};

export type ThreeByThreeCellViewModel = SceneCardCellViewModel & {
    index: number;
    isCenter: boolean;
    isTopEdge: boolean;
    isBottomEdge: boolean;
    isLeftEdge: boolean;
    isRightEdge: boolean;
    sectionBackground: string | null;
};

const isCrossPosition = (row: number, col: number) =>
    (row === 0 && col === 1) ||
    (row === 1 && col === 0) ||
    (row === 1 && col === 2) ||
    (row === 2 && col === 1);

const isCrossIndex = (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return isCrossPosition(row, col);
};

export type ThreeByThreeCardCellDescriptorExtra = {
    index: number;
    isCenter: boolean;
    isTopEdge: boolean;
    isBottomEdge: boolean;
    isLeftEdge: boolean;
    isRightEdge: boolean;
    sectionBackground: string | null;
};

export const build3x3CardCellDescriptors = ({
    theme,
    layout,
    topology,
    displaySnapshot,
    displayPolicy,
}: {
    theme: string;
    layout: ReturnType<typeof getMandalaLayoutById>;
    topology: MandalaTopologyIndex;
    displaySnapshot: SceneDisplaySnapshot;
    displayPolicy: CellDisplayPolicy;
}): SceneCardCellDescriptorList<ThreeByThreeCardCellDescriptorExtra> =>
    layout.childSlots.map((slot, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const section = slot ? `${theme}.${slot}` : theme;
        const nodeId = getSectionNodeId(topology, section);
        const sectionColorContext = {
            backgroundMode: displaySnapshot.backgroundMode,
            sectionColorsBySection: displaySnapshot.sectionColors,
            sectionColorOpacity: displaySnapshot.sectionColorOpacity,
            showGrayBlockBackground: isCrossIndex(index),
        };
        const sectionBackground = resolveSectionSurfaceVisual({
            section,
            colorContext: sectionColorContext,
        }).backgroundColor;
        const frame: SceneCardCellFrame = {
            key: section,
            section,
            nodeId,
        };
        const seed = createSceneCardCellSeed({
            key: frame.key,
            section: frame.section,
            nodeId: frame.nodeId,
            contentEnabled: true,
            sectionColorContext,
            displayPolicy,
        });

        return {
            seed,
            extra: {
                index,
                isCenter: section === theme,
                isTopEdge: row === 0,
                isBottomEdge: row === 2,
                isLeftEdge: col === 0,
                isRightEdge: col === 2,
                sectionBackground,
            },
        };
    });

export const assemble3x3CellViewModels = ({
    theme,
    selectedLayoutId,
    customLayouts,
    topology,
    interaction,
    gridStyle,
    displaySnapshot,
}: Assemble3x3CellViewModelsArgs): ThreeByThreeCellViewModel[] => {
    const layout = getMandalaLayoutById(selectedLayoutId, customLayouts);

    const descriptors = build3x3CardCellDescriptors({
        theme,
        layout,
        topology,
        displaySnapshot,
        displayPolicy: gridStyle.cellDisplayPolicy,
    });

    return buildSceneCardCellList({
        descriptors,
        interaction,
    });
};
