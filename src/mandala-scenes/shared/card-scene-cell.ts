import { buildMandalaCardViewModel } from 'src/mandala-cell/model/build-mandala-card-view-model';
import type {
    MandalaCardUiState,
    MandalaCardViewModel,
} from 'src/mandala-cell/model/card-view-model';
import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';

export type SceneCardEditingState = {
    activeNodeId: string | null;
    isInSidebar: boolean;
};

export type SceneCardCellFrame = {
    key: string;
    section: string;
    nodeId: string | null;
};

export type SceneCardCellDescriptor = {
    nodeId: string | null;
    section: string;
    contentEnabled: boolean;
    sectionColor: string | null;
    metaAccentColor: string | null;
    displayPolicy: CellDisplayPolicy;
};

export type SceneCardCellSeed = {
    frame: SceneCardCellFrame;
    descriptor: SceneCardCellDescriptor;
};

export type SceneCardInteractionDescriptor = {
    activeNodeId: string | null;
    editingState: SceneCardEditingState;
    selectedNodes: Set<string>;
    pinnedSections: Set<string>;
    showDetailSidebar: boolean;
};

export type SceneCardCellOutput = {
    cardViewModel: MandalaCardViewModel | null;
    cardUiState: MandalaCardUiState;
};

export type SceneCardCellViewModel = SceneCardCellFrame & SceneCardCellOutput;

export const buildSceneCardViewModel = (
    descriptor: SceneCardCellDescriptor,
): MandalaCardViewModel | null =>
    descriptor.nodeId
        ? buildMandalaCardViewModel({
              nodeId: descriptor.nodeId,
              section: descriptor.section,
              contentEnabled: descriptor.contentEnabled,
              style: undefined,
              sectionColor: descriptor.sectionColor,
              metaAccentColor: descriptor.metaAccentColor,
              displayPolicy: descriptor.displayPolicy,
          })
        : null;

export const createInactiveSceneCardUiState = (): MandalaCardUiState => ({
    active: false,
    editing: false,
    selected: false,
    pinned: false,
});

export const buildSceneCardUiState = ({
    nodeId,
    section,
    activeNodeId,
    editingState,
    selectedNodes,
    pinnedSections,
    showDetailSidebar,
}: {
    nodeId: string;
    section: string;
    activeNodeId: string | null;
    editingState: SceneCardEditingState;
    selectedNodes: Set<string>;
    pinnedSections: Set<string>;
    showDetailSidebar: boolean;
}): MandalaCardUiState => ({
    active: nodeId === activeNodeId,
    editing:
        editingState.activeNodeId === nodeId &&
        !editingState.isInSidebar &&
        !showDetailSidebar,
    selected: selectedNodes.has(nodeId),
    pinned: pinnedSections.has(section),
});

export const buildSceneCardCell = ({
    seed,
    interaction,
}: {
    seed: SceneCardCellSeed;
    interaction: SceneCardInteractionDescriptor;
}): SceneCardCellViewModel => {
    const { frame, descriptor } = seed;
    const cardViewModel = buildSceneCardViewModel(descriptor);
    const cardUiState = descriptor.nodeId
        ? buildSceneCardUiState({
              nodeId: descriptor.nodeId,
              section: descriptor.section,
              activeNodeId: interaction.activeNodeId,
              editingState: interaction.editingState,
              selectedNodes: interaction.selectedNodes,
              pinnedSections: interaction.pinnedSections,
              showDetailSidebar: interaction.showDetailSidebar,
          })
        : createInactiveSceneCardUiState();

    return {
        key: frame.key,
        section: frame.section,
        nodeId: frame.nodeId,
        cardViewModel,
        cardUiState,
    };
};

export const createSceneCardCellSeed = ({
    key,
    section,
    nodeId,
    contentEnabled,
    sectionColor,
    metaAccentColor,
    displayPolicy,
}: {
    key: string;
    section: string;
    nodeId: string | null;
    contentEnabled: boolean;
    sectionColor: string | null;
    metaAccentColor: string | null;
    displayPolicy: CellDisplayPolicy;
}): SceneCardCellSeed => ({
    frame: {
        key,
        section,
        nodeId,
    },
    descriptor: {
        nodeId,
        section,
        contentEnabled,
        sectionColor,
        metaAccentColor,
        displayPolicy,
    },
});
