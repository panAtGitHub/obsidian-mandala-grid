import { buildMandalaCardViewModel } from 'src/mandala-cell/model/build-mandala-card-view-model';
import type { MandalaCardViewModel } from 'src/mandala-cell/model/card-view-model';
import { buildCellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import { buildCellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';
import { resolveSectionBackgroundInput } from 'src/mandala-display/logic/section-colors';
import type { Nx9Context } from 'src/mandala-scenes/view-nx9/context';
import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import type { CellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';

type Nx9EditingState = {
    activeNodeId: string | null;
    isInSidebar: boolean;
};

type AssembleNx9RowsOptions = {
    context: Nx9Context;
    documentState: {
        sections: {
            section_id: Record<string, string>;
        };
    };
    activeNodeId: string | null;
    activeCell: { row: number; col: number; page?: number } | null;
    editingState: Nx9EditingState;
    selectedNodes: Set<string>;
    pinnedSections: Set<string>;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    backgroundMode: string;
    showDetailSidebar: boolean;
    whiteThemeMode: boolean;
};

export type Nx9RealCellViewModel = {
    kind: 'real-cell';
    key: string;
    row: number;
    col: number;
    section: string;
    nodeId: string | null;
    isActiveCell: boolean;
    isActiveNode: boolean;
    isTopEdge: boolean;
    isBottomEdge: boolean;
    isLeftEdge: boolean;
    isRightEdge: boolean;
    cardViewModel: MandalaCardViewModel | null;
};

export type Nx9GhostRowViewModel = {
    kind: 'ghost-row';
    key: string;
    row: number;
    nextCoreSection: string;
    isActiveCell: boolean;
    isTopEdge: boolean;
    isBottomEdge: boolean;
    showFutureHint: boolean;
};

export type Nx9PaddingRowViewModel = {
    kind: 'padding-row';
    key: string;
    row: number;
    isTopEdge: boolean;
    isBottomEdge: boolean;
};

export type Nx9RowViewModel =
    | Nx9RealCellViewModel[]
    | Nx9GhostRowViewModel
    | Nx9PaddingRowViewModel;

const isActiveCell = (
    activeCell: { row: number; col: number; page?: number } | null,
    row: number,
    col: number,
    currentPage: number,
) =>
    !!activeCell &&
    activeCell.row === row &&
    activeCell.col === col &&
    (activeCell.page ?? currentPage) === currentPage;

const createRealCellViewModel = ({
    context,
    documentState,
    activeNodeId,
    activeCell,
    editingState,
    selectedNodes,
    pinnedSections,
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    displayPolicy,
    interactionPolicy,
    row,
    col,
    rowCount,
    coreSection,
}: AssembleNx9RowsOptions & {
    displayPolicy: CellDisplayPolicy;
    interactionPolicy: CellInteractionPolicy;
    row: number;
    col: number;
    rowCount: number;
    coreSection: string;
}): Nx9RealCellViewModel => {
    const section = col === 0 ? coreSection : `${coreSection}.${col}`;
    const nodeId = documentState.sections.section_id[section] ?? null;

    return {
        kind: 'real-cell',
        key: `${context.currentPage}-${row}-${col}`,
        row,
        col,
        section,
        nodeId,
        isActiveCell: isActiveCell(activeCell, row, col, context.currentPage),
        isActiveNode: !activeCell && !!nodeId && nodeId === activeNodeId,
        isTopEdge: row === 0,
        isBottomEdge: row === rowCount - 1,
        isLeftEdge: col === 0,
        isRightEdge: col === 8,
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
                  sectionColor: resolveSectionBackgroundInput({
                      section,
                      backgroundMode,
                      sectionColorsBySection: sectionColors,
                      sectionColorOpacity,
                  }),
                  metaAccentColor: sectionColors[section] ?? null,
                  displayPolicy,
                  interactionPolicy,
                  gridCell: {
                      mode: 'nx9',
                      row,
                      col,
                      page: context.currentPage,
                  },
              })
            : null,
    };
};

export const assembleNx9Rows = (
    options: AssembleNx9RowsOptions,
): Nx9RowViewModel[] => {
    const {
        context,
        activeCell,
        whiteThemeMode,
    } = options;
    const rowCount = context.rowsPerPage;
    const showFutureHint = rowCount <= 5;
    const displayPolicy: CellDisplayPolicy = buildCellDisplayPolicy({
        preset: 'grid-nx9',
        whiteThemeMode,
    });
    const interactionPolicy: CellInteractionPolicy = buildCellInteractionPolicy({
        preset: 'grid-nx9',
    });

    return context.pageRows.map((rowModel, row) => {
        if (rowModel.kind === 'real-core-row') {
            return Array.from({ length: 9 }, (_, col) =>
                createRealCellViewModel({
                    ...options,
                    displayPolicy,
                    interactionPolicy,
                    row,
                    col,
                    rowCount,
                    coreSection: rowModel.coreSection,
                }),
            );
        }

        if (rowModel.kind === 'ghost-next-core-row') {
            return {
                kind: 'ghost-row',
                key: `${context.currentPage}-${row}-ghost`,
                row,
                nextCoreSection: rowModel.nextCoreSection,
                isActiveCell: isActiveCell(activeCell, row, 0, context.currentPage),
                isTopEdge: row === 0,
                isBottomEdge: row === rowCount - 1,
                showFutureHint,
            };
        }

        return {
            kind: 'padding-row',
            key: `${context.currentPage}-${row}-padding`,
            row,
            isTopEdge: row === 0,
            isBottomEdge: row === rowCount - 1,
        };
    });
};
