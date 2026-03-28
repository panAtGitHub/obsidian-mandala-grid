import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';
import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import { resolveSectionBackgroundInput } from 'src/mandala-display/logic/section-colors';
import {
    buildWeekPlanBaseCells,
    type WeekPlanBaseCell,
} from 'src/mandala-display/logic/week-plan-context';
import type { WeekPlanRow } from 'src/mandala-display/logic/day-plan';
import {
    buildSceneCardCellList,
    createSceneCardCellSeed,
    type SceneCardCellDescriptorList,
    type SceneCardCellViewModel,
} from 'src/mandala-scenes/shared/card-scene-cell';
import { buildNx9WeekCellDisplayOverrides } from 'src/mandala-scenes/view-nx9-week-7x9/build-cell-display-overrides';

type EditingState = {
    activeNodeId: string | null;
    isInSidebar: boolean;
};

export type Nx9WeekCellViewModel = WeekPlanBaseCell &
    SceneCardCellViewModel & {
        isActiveCell: boolean;
        isActiveNode: boolean;
        isTopEdge: boolean;
        isBottomEdge: boolean;
        isLeftEdge: boolean;
        isRightEdge: boolean;
    };

export const assembleNx9WeekCells = ({
    rows,
    sectionIdMap,
    activeNodeId,
    activeCell,
    compactMode,
    editingState,
    selectedNodes,
    pinnedSections,
    themeSnapshot,
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    whiteThemeMode,
}: {
    rows: WeekPlanRow[];
    sectionIdMap: Record<string, string | undefined>;
    activeNodeId: string | null;
    activeCell: { row: number; col: number; page?: number } | null;
    compactMode: boolean;
    editingState: EditingState;
    selectedNodes: Set<string>;
    pinnedSections: Set<string>;
    themeSnapshot: MandalaThemeSnapshot;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    backgroundMode: string;
    showDetailSidebar: boolean;
    whiteThemeMode: boolean;
}): Nx9WeekCellViewModel[] => {
    void themeSnapshot;

    const displayPolicy = {
        ...createDefaultCellDisplayPolicy(),
        ...buildNx9WeekCellDisplayOverrides({
            whiteThemeMode,
            hasGridSelection: Boolean(activeCell),
            compactMode,
        }),
    };
    const normalizedPage = activeCell?.page ?? 0;
    const descriptors: SceneCardCellDescriptorList<
        Omit<Nx9WeekCellViewModel, keyof SceneCardCellViewModel>
    > = buildWeekPlanBaseCells({ rows, sectionIdMap }).map((cell) => ({
        seed: createSceneCardCellSeed({
            key: `${cell.row}:${cell.col}`,
            section: cell.section ?? `${cell.row}:${cell.col}`,
            nodeId: cell.nodeId,
            contentEnabled: true,
            sectionColor: cell.section
                ? resolveSectionBackgroundInput({
                      section: cell.section,
                      backgroundMode,
                      sectionColorsBySection: sectionColors,
                      sectionColorOpacity,
                  })
                : null,
            metaAccentColor: cell.section
                ? sectionColors[cell.section] ?? null
                : null,
            displayPolicy,
        }),
        extra: {
            row: cell.row,
            col: cell.col,
            section: cell.section,
            nodeId: cell.nodeId,
            isPlaceholder: cell.isPlaceholder,
            isCenterColumn: cell.isCenterColumn,
            emptyLabel: cell.emptyLabel,
            isActiveCell:
                !!activeCell &&
                normalizedPage === 0 &&
                activeCell.row === cell.row &&
                activeCell.col === cell.col,
            isActiveNode:
                !activeCell && !!cell.nodeId && cell.nodeId === activeNodeId,
            isTopEdge: cell.row === 0,
            isBottomEdge: cell.row === 6,
            isLeftEdge: cell.col === 0,
            isRightEdge: cell.col === 8,
        },
    }));

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
