import { buildMandalaCardViewModel } from 'src/mandala-cell/model/build-mandala-card-view-model';
import type { MandalaCardViewModel } from 'src/mandala-cell/model/card-view-model';
import { buildCellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import { buildCellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';
import { resolveCustomSectionColor } from 'src/mandala-display/logic/section-colors';
import type { MandalaCustomLayout } from 'src/mandala-settings/state/settings-type';
import { getMandalaLayoutById } from 'src/view/helpers/mandala/mandala-grid';

type ThreeByThreeEditingState = {
    activeNodeId: string | null;
    isInSidebar: boolean;
};

type Assemble3x3CellViewModelsOptions = {
    theme: string;
    selectedLayoutId: string | null;
    customLayouts: MandalaCustomLayout[];
    sectionToNodeId: Record<string, string>;
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

export type ThreeByThreeCellViewModel = {
    key: string;
    section: string;
    index: number;
    nodeId: string | null;
    isCenter: boolean;
    sectionBackground: string | null;
    cardViewModel: MandalaCardViewModel | null;
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
    const customColor = resolveCustomSectionColor({
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

export const assemble3x3CellViewModels = ({
    theme,
    selectedLayoutId,
    customLayouts,
    sectionToNodeId,
    activeNodeId,
    editingState,
    selectedNodes,
    pinnedSections,
    showDetailSidebar,
    backgroundMode,
    sectionColors,
    sectionColorOpacity,
    whiteThemeMode,
}: Assemble3x3CellViewModelsOptions): ThreeByThreeCellViewModel[] => {
    const layout = getMandalaLayoutById(selectedLayoutId, customLayouts);
    const displayPolicy = buildCellDisplayPolicy({
        preset: 'grid-3x3',
        whiteThemeMode,
    });
    const interactionPolicy = buildCellInteractionPolicy({
        preset: 'grid-3x3',
    });

    return layout.childSlots.map((slot, index) => {
        const section = slot ? `${theme}.${slot}` : theme;
        const nodeId = sectionToNodeId[section] ?? null;
        const sectionBackground = getSectionBackground({
            section,
            index,
            backgroundMode,
            sectionColors,
            sectionColorOpacity,
        });

        return {
            key: section,
            section,
            index,
            nodeId,
            isCenter: section === theme,
            sectionBackground,
            cardViewModel: nodeId
                ? buildMandalaCardViewModel({
                      nodeId,
                      section,
                      active: nodeId === activeNodeId,
                      editing:
                          editingState.activeNodeId === nodeId &&
                          !editingState.isInSidebar &&
                          !showDetailSidebar,
                      selected: selectedNodes.has(nodeId),
                      pinned: pinnedSections.has(section),
                      style: undefined,
                      sectionColor: sectionBackground,
                      metaAccentColor: sectionColors[section] ?? null,
                      displayPolicy,
                      interactionPolicy,
                      gridCell: null,
                  })
                : null,
        };
    });
};
