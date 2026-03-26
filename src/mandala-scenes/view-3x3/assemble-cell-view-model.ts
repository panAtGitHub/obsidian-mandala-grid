import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';
import type { MandalaTopologyIndex } from 'src/mandala-display/logic/mandala-topology';
import { getSectionNodeId } from 'src/mandala-display/logic/mandala-topology';
import { resolveSectionBackgroundInput } from 'src/mandala-display/logic/section-colors';
import type { MandalaCustomLayout } from 'src/mandala-settings/state/settings-type';
import { getMandalaLayoutById } from 'src/mandala-display/logic/mandala-grid';
import {
    buildSceneCardCellList,
    createSceneCardCellSeed,
    type SceneCardCellDescriptorList,
    type SceneCardCellFrame,
    type SceneCardCellViewModel,
} from 'src/mandala-scenes/shared/card-scene-cell';
import { build3x3CellDisplayOverrides } from 'src/mandala-scenes/view-3x3/build-cell-display-overrides';

type ThreeByThreeEditingState = {
    activeNodeId: string | null;
    isInSidebar: boolean;
};

export type Assemble3x3CellViewModelsArgs = {
    theme: string;
    selectedLayoutId: string | null;
    customLayouts: MandalaCustomLayout[];
    topology: MandalaTopologyIndex;
    activeNodeId: string | null;
    editingState: ThreeByThreeEditingState;
    selectedNodes: Set<string>;
    pinnedSections: Set<string>;
    showDetailSidebar: boolean;
    backgroundMode: string;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    whiteThemeMode: boolean;
};

export type ThreeByThreeCellViewModel = SceneCardCellViewModel & {
    index: number;
    isCenter: boolean;
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

const getSectionBackground = ({
    section,
    index,
    backgroundMode,
    sectionColors,
    sectionColorOpacity,
}: {
    section: string;
    index: number;
    backgroundMode: string;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
}) => {
    const customColor = resolveSectionBackgroundInput({
        section,
        backgroundMode,
        sectionColorsBySection: sectionColors,
        sectionColorOpacity,
    });
    if (customColor) return customColor;
    if (backgroundMode === 'gray' && isCrossIndex(index)) {
        return `color-mix(in srgb, var(--mandala-gray-block-base) ${sectionColorOpacity}%, transparent)`;
    }
    return null;
};

type ThreeByThreeCardCellDescriptorExtra = {
    index: number;
    isCenter: boolean;
    sectionBackground: string | null;
};

export const build3x3CardCellDescriptors = ({
    theme,
    layout,
    topology,
    backgroundMode,
    sectionColors,
    sectionColorOpacity,
    displayPolicy,
}: {
    theme: string;
    layout: ReturnType<typeof getMandalaLayoutById>;
    topology: MandalaTopologyIndex;
    backgroundMode: string;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    displayPolicy: ReturnType<typeof createDefaultCellDisplayPolicy>;
}): SceneCardCellDescriptorList<ThreeByThreeCardCellDescriptorExtra> =>
    layout.childSlots.map((slot, index) => {
        const section = slot ? `${theme}.${slot}` : theme;
        const nodeId = getSectionNodeId(topology, section);
        const sectionBackground = getSectionBackground({
            section,
            index,
            backgroundMode,
            sectionColors,
            sectionColorOpacity,
        });
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
            sectionColor: sectionBackground,
            metaAccentColor: sectionColors[section] ?? null,
            displayPolicy,
        });

        return {
            seed,
            extra: {
                index,
                isCenter: section === theme,
                sectionBackground,
            },
        };
    });

export const assemble3x3CellViewModels = ({
    theme,
    selectedLayoutId,
    customLayouts,
    topology,
    activeNodeId,
    editingState,
    selectedNodes,
    pinnedSections,
    showDetailSidebar,
    backgroundMode,
    sectionColors,
    sectionColorOpacity,
    whiteThemeMode,
}: Assemble3x3CellViewModelsArgs): ThreeByThreeCellViewModel[] => {
    const layout = getMandalaLayoutById(selectedLayoutId, customLayouts);
    const displayPolicy = {
        ...createDefaultCellDisplayPolicy(),
        ...build3x3CellDisplayOverrides({
            whiteThemeMode,
        }),
    };

    const descriptors = build3x3CardCellDescriptors({
        theme,
        layout,
        topology,
        backgroundMode,
        sectionColors,
        sectionColorOpacity,
        displayPolicy,
    });

    return buildSceneCardCellList({
        descriptors,
        interaction: {
            activeNodeId,
            editingState,
            selectedNodes,
            pinnedSections,
            showDetailSidebar,
        },
    });
};
