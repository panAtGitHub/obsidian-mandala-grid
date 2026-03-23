import { buildMandalaCardViewModel } from 'src/mandala-cell/model/build-mandala-card-view-model';
import type {
    MandalaCardUiState,
    MandalaCardViewModel,
} from 'src/mandala-cell/model/card-view-model';
import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';
import { buildCellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';
import { resolveSectionBackgroundInput } from 'src/mandala-display/logic/section-colors';
import type {
    Nx9CellWithPage,
    Nx9PageContext,
} from 'src/mandala-scenes/view-nx9/context';
import type { CellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';
import { buildNx9CellDisplayOverrides } from 'src/mandala-scenes/view-nx9/build-cell-display-overrides';

type Nx9EditingState = {
    activeNodeId: string | null;
    isInSidebar: boolean;
};

type SharedStaticNx9RowsOptions = {
    context: Nx9PageContext;
    pageFrame: Nx9PageFrameRowViewModel[];
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    backgroundMode: string;
    whiteThemeMode: boolean;
    hydratedNodeIds: Set<string>;
};

type SharedInteractiveNx9RowsOptions = {
    context: Nx9PageContext;
    activeNodeId: string | null;
    activeCell: { row: number; col: number; page?: number } | null;
    editingState: Nx9EditingState;
    selectedNodes: Set<string>;
    pinnedSections: Set<string>;
    showDetailSidebar: boolean;
};

type AssembleNx9RowsOptions = SharedStaticNx9RowsOptions &
    SharedInteractiveNx9RowsOptions & {
        documentState: {
            sections: {
                section_id: Record<string, string>;
            };
        };
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
    cardUiState: MandalaCardUiState;
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

export type Nx9RealCellFrameViewModel = Omit<
    Nx9RealCellViewModel,
    'isActiveCell' | 'isActiveNode' | 'cardViewModel' | 'cardUiState'
>;

export type Nx9PageFrameRowViewModel =
    | Nx9RealCellFrameViewModel[]
    | Nx9GhostRowViewModel
    | Nx9PaddingRowViewModel;

export type Nx9RealCellStaticViewModel = Omit<
    Nx9RealCellViewModel,
    'isActiveCell' | 'isActiveNode' | 'cardUiState'
>;

export type Nx9StaticRowViewModel =
    | Nx9RealCellStaticViewModel[]
    | Nx9GhostRowViewModel
    | Nx9PaddingRowViewModel;

export type Nx9CellIndexEntry = {
    key: string;
    row: number;
    col: number;
    kind: 'real-cell' | 'ghost-row';
    nodeId: string | null;
};

export type Nx9PageIndex = {
    cellByKey: Record<string, Nx9CellIndexEntry>;
    cellByPosition: Record<string, Nx9CellIndexEntry>;
    positionByNodeId: Record<string, Nx9CellIndexEntry>;
    nodeIds: string[];
};

export type Nx9InteractionSnapshot = {
    activeNodeId: string | null;
    activeCell: Nx9CellWithPage | null;
    activeCellKey: string | null;
    editingNodeId: string | null;
    editingInSidebar: boolean;
    selectedStamp: string;
    pinnedStamp: string;
    showDetailSidebar: boolean;
};

type PatchNx9ActiveInteractionStateOptions = {
    rows: Nx9RowViewModel[];
    staticRows: Nx9StaticRowViewModel[];
    pageIndex: Nx9PageIndex;
    context: Nx9PageContext;
    previousInteraction: Nx9InteractionSnapshot;
    nextInteraction: Nx9InteractionSnapshot;
};

type PatchNx9ActiveInteractionStateResult = {
    rows: Nx9RowViewModel[];
    changedRowCount: number;
    changedCellCount: number;
};

const cellPositionKey = (row: number, col: number) => `${row}:${col}`;

const normalizeActiveCell = (
    activeCell: { row: number; col: number; page?: number } | null,
    currentPage: number,
): Nx9CellWithPage | null =>
    activeCell
        ? {
              row: activeCell.row,
              col: activeCell.col,
              page: activeCell.page ?? currentPage,
          }
        : null;

const isActiveCell = (
    activeCell: Nx9CellWithPage | null,
    row: number,
    col: number,
    currentPage: number,
) =>
    !!activeCell &&
    activeCell.row === row &&
    activeCell.col === col &&
    activeCell.page === currentPage;

const createDisplayPolicy = (whiteThemeMode: boolean): CellDisplayPolicy => ({
    ...createDefaultCellDisplayPolicy(),
    ...buildNx9CellDisplayOverrides({
        whiteThemeMode,
    }),
});

const createInteractionPolicy = (): CellInteractionPolicy =>
    buildCellInteractionPolicy({});

const buildCardUiState = ({
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
    editingState: Nx9EditingState;
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

const createInactiveCardUiState = (): MandalaCardUiState => ({
    active: false,
    editing: false,
    selected: false,
    pinned: false,
});

const createRealCellFrameViewModel = ({
    context,
    documentState,
    row,
    col,
    rowCount,
    coreSection,
}: {
    context: Nx9PageContext;
    documentState: {
        sections: {
            section_id: Record<string, string>;
        };
    };
    row: number;
    col: number;
    rowCount: number;
    coreSection: string;
}): Nx9RealCellFrameViewModel => {
    const section = col === 0 ? coreSection : `${coreSection}.${col}`;
    const nodeId = documentState.sections.section_id[section] ?? null;

    return {
        kind: 'real-cell',
        key: `${context.currentPage}-${row}-${col}`,
        row,
        col,
        section,
        nodeId,
        isTopEdge: row === 0,
        isBottomEdge: row === rowCount - 1,
        isLeftEdge: col === 0,
        isRightEdge: col === 8,
    };
};

export const assembleNx9PageFrame = ({
    context,
    documentState,
}: {
    context: Nx9PageContext;
    documentState: {
        sections: {
            section_id: Record<string, string>;
        };
    };
}): Nx9PageFrameRowViewModel[] => {
    const rowCount = context.rowsPerPage;
    const showFutureHint = rowCount <= 5;

    return context.pageRows.map((rowModel, row) => {
        if (rowModel.kind === 'real-core-row') {
            return Array.from({ length: 9 }, (_, col) =>
                createRealCellFrameViewModel({
                    context,
                    documentState,
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
                isActiveCell: false,
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

export const collectNx9HydratableNodeIds = (
    pageFrame: Nx9PageFrameRowViewModel[],
) =>
    pageFrame.flatMap((row) =>
        Array.isArray(row)
            ? row
                  .map((cell) => cell.nodeId)
                  .filter((nodeId): nodeId is string => Boolean(nodeId))
            : [],
    );

export const buildNx9PageIndex = (
    pageFrame: Nx9PageFrameRowViewModel[],
): Nx9PageIndex => {
    const cellByKey: Record<string, Nx9CellIndexEntry> = {};
    const cellByPosition: Record<string, Nx9CellIndexEntry> = {};
    const positionByNodeId: Record<string, Nx9CellIndexEntry> = {};
    const nodeIds: string[] = [];

    for (const row of pageFrame) {
        if (Array.isArray(row)) {
            for (const cell of row) {
                const entry: Nx9CellIndexEntry = {
                    key: cell.key,
                    row: cell.row,
                    col: cell.col,
                    kind: 'real-cell',
                    nodeId: cell.nodeId,
                };
                cellByKey[cell.key] = entry;
                cellByPosition[cellPositionKey(cell.row, cell.col)] = entry;
                if (cell.nodeId) {
                    positionByNodeId[cell.nodeId] = entry;
                    nodeIds.push(cell.nodeId);
                }
            }
            continue;
        }

        if (row.kind === 'ghost-row') {
            const entry: Nx9CellIndexEntry = {
                key: row.key,
                row: row.row,
                col: 0,
                kind: 'ghost-row',
                nodeId: null,
            };
            cellByKey[row.key] = entry;
            cellByPosition[cellPositionKey(row.row, 0)] = entry;
        }
    }

    return {
        cellByKey,
        cellByPosition,
        positionByNodeId,
        nodeIds,
    };
};

export const buildNx9PageStaticRows = ({
    pageFrame,
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    whiteThemeMode,
    hydratedNodeIds,
}: SharedStaticNx9RowsOptions): Nx9StaticRowViewModel[] => {
    const displayPolicy = createDisplayPolicy(whiteThemeMode);
    const interactionPolicy = createInteractionPolicy();

    return pageFrame.map((row) => {
        if (!Array.isArray(row)) {
            return row;
        }

        return row.map((cell) => ({
            ...cell,
            cardViewModel: cell.nodeId
                ? buildMandalaCardViewModel({
                      nodeId: cell.nodeId,
                      section: cell.section,
                      style: undefined,
                      sectionColor: resolveSectionBackgroundInput({
                          section: cell.section,
                          backgroundMode,
                          sectionColorsBySection: sectionColors,
                          sectionColorOpacity,
                      }),
                      metaAccentColor: sectionColors[cell.section] ?? null,
                      displayPolicy,
                      interactionPolicy,
                      contentEnabled: hydratedNodeIds.has(cell.nodeId),
                  })
                : null,
        }));
    });
};

export const applyNx9PageInteractionState = ({
    context,
    staticRows,
    activeNodeId,
    activeCell,
    editingState,
    selectedNodes,
    pinnedSections,
    showDetailSidebar,
}: SharedInteractiveNx9RowsOptions & {
    staticRows: Nx9StaticRowViewModel[];
}): Nx9RowViewModel[] => {
    const normalizedActiveCell = normalizeActiveCell(activeCell, context.currentPage);

    return staticRows.map((row) => {
        if (!Array.isArray(row)) {
            if (row.kind === 'ghost-row') {
                const nextIsActiveCell = isActiveCell(
                    normalizedActiveCell,
                    row.row,
                    0,
                    context.currentPage,
                );
                return nextIsActiveCell === row.isActiveCell
                    ? row
                    : {
                          ...row,
                          isActiveCell: nextIsActiveCell,
                      };
            }
            return row;
        }

        return row.map((cell) => {
            const nextCardUiState = cell.nodeId
                ? buildCardUiState({
                      nodeId: cell.nodeId,
                      section: cell.section,
                      activeNodeId,
                      editingState,
                      selectedNodes,
                      pinnedSections,
                      showDetailSidebar,
                  })
                : createInactiveCardUiState();

            return {
                ...cell,
                isActiveCell: isActiveCell(
                    normalizedActiveCell,
                    cell.row,
                    cell.col,
                    context.currentPage,
                ),
                isActiveNode:
                    !normalizedActiveCell &&
                    !!cell.nodeId &&
                    cell.nodeId === activeNodeId,
                cardUiState: nextCardUiState,
            };
        });
    });
};

const patchRealCell = ({
    previousCell,
    staticCell,
    context,
    nextInteraction,
}: {
    previousCell: Nx9RealCellViewModel;
    staticCell: Nx9RealCellStaticViewModel;
    context: Nx9PageContext;
    nextInteraction: Nx9InteractionSnapshot;
}) => {
    const nextIsActiveCell = isActiveCell(
        nextInteraction.activeCell,
        staticCell.row,
        staticCell.col,
        context.currentPage,
    );
    const nextIsActiveNode =
        !nextInteraction.activeCell &&
        !!staticCell.nodeId &&
        staticCell.nodeId === nextInteraction.activeNodeId;
    const nextCardActive =
        !!staticCell.nodeId && staticCell.nodeId === nextInteraction.activeNodeId;

    const currentCardUiState = previousCell.cardUiState;
    const nextCardUiState =
        currentCardUiState.active === nextCardActive
            ? currentCardUiState
            : {
                  ...currentCardUiState,
                  active: nextCardActive,
              };

    if (
        previousCell.isActiveCell === nextIsActiveCell &&
        previousCell.isActiveNode === nextIsActiveNode &&
        previousCell.cardUiState === nextCardUiState
    ) {
        return {
            cell: previousCell,
            changed: false,
        };
    }

    return {
        cell: {
            ...previousCell,
            isActiveCell: nextIsActiveCell,
            isActiveNode: nextIsActiveNode,
            cardUiState: nextCardUiState,
        },
        changed: true,
    };
};

const addAffectedPosition = (
    positions: Map<string, Nx9CellIndexEntry>,
    entry: Nx9CellIndexEntry | null | undefined,
) => {
    if (!entry) return;
    positions.set(cellPositionKey(entry.row, entry.col), entry);
};

export const patchNx9ActiveInteractionState = ({
    rows,
    staticRows,
    pageIndex,
    context,
    previousInteraction,
    nextInteraction,
}: PatchNx9ActiveInteractionStateOptions): PatchNx9ActiveInteractionStateResult => {
    const affectedPositions = new Map<string, Nx9CellIndexEntry>();

    addAffectedPosition(
        affectedPositions,
        previousInteraction.activeCell
            ? pageIndex.cellByPosition[
                  cellPositionKey(
                      previousInteraction.activeCell.row,
                      previousInteraction.activeCell.col,
                  )
              ]
            : null,
    );
    addAffectedPosition(
        affectedPositions,
        nextInteraction.activeCell
            ? pageIndex.cellByPosition[
                  cellPositionKey(
                      nextInteraction.activeCell.row,
                      nextInteraction.activeCell.col,
                  )
              ]
            : null,
    );
    addAffectedPosition(
        affectedPositions,
        previousInteraction.activeNodeId
            ? pageIndex.positionByNodeId[previousInteraction.activeNodeId]
            : null,
    );
    addAffectedPosition(
        affectedPositions,
        nextInteraction.activeNodeId
            ? pageIndex.positionByNodeId[nextInteraction.activeNodeId]
            : null,
    );

    if (affectedPositions.size === 0) {
        return {
            rows,
            changedRowCount: 0,
            changedCellCount: 0,
        };
    }

    const nextRows = rows.slice();
    const rowToCols = new Map<number, Set<number>>();
    let changedRowCount = 0;
    let changedCellCount = 0;

    for (const entry of affectedPositions.values()) {
        const cols = rowToCols.get(entry.row) ?? new Set<number>();
        cols.add(entry.col);
        rowToCols.set(entry.row, cols);
    }

    for (const [rowIndex, cols] of rowToCols) {
        const staticRow = staticRows[rowIndex];
        const previousRow = rows[rowIndex];
        if (!staticRow || !previousRow) continue;

        if (Array.isArray(staticRow) && Array.isArray(previousRow)) {
            const nextRow = previousRow.slice();
            let rowChanged = false;

            for (const col of cols) {
                const staticCell = staticRow[col];
                const previousCell = previousRow[col];
                if (!staticCell || !previousCell) continue;

                const { cell, changed } = patchRealCell({
                    previousCell,
                    staticCell,
                    context,
                    nextInteraction,
                });
                if (!changed) continue;
                nextRow[col] = cell;
                rowChanged = true;
                changedCellCount += 1;
            }

            if (rowChanged) {
                nextRows[rowIndex] = nextRow;
                changedRowCount += 1;
            }
            continue;
        }

        if (!Array.isArray(staticRow) && !Array.isArray(previousRow)) {
            if (staticRow.kind !== 'ghost-row' || previousRow.kind !== 'ghost-row') {
                continue;
            }

            const nextIsActiveCell = isActiveCell(
                nextInteraction.activeCell,
                staticRow.row,
                0,
                context.currentPage,
            );
            if (previousRow.isActiveCell === nextIsActiveCell) continue;
            nextRows[rowIndex] = {
                ...previousRow,
                isActiveCell: nextIsActiveCell,
            };
            changedRowCount += 1;
            changedCellCount += 1;
        }
    }

    return {
        rows: nextRows,
        changedRowCount,
        changedCellCount,
    };
};

export const assembleNx9Rows = (
    options: AssembleNx9RowsOptions,
): Nx9RowViewModel[] => {
    const pageFrame = assembleNx9PageFrame({
        context: options.context,
        documentState: options.documentState,
    });
    const staticRows = buildNx9PageStaticRows({
        context: options.context,
        pageFrame,
        sectionColors: options.sectionColors,
        sectionColorOpacity: options.sectionColorOpacity,
        backgroundMode: options.backgroundMode,
        whiteThemeMode: options.whiteThemeMode,
        hydratedNodeIds: new Set(collectNx9HydratableNodeIds(pageFrame)),
    });

    return applyNx9PageInteractionState({
        context: options.context,
        staticRows,
        activeNodeId: options.activeNodeId,
        activeCell: options.activeCell,
        editingState: options.editingState,
        selectedNodes: options.selectedNodes,
        pinnedSections: options.pinnedSections,
        showDetailSidebar: options.showDetailSidebar,
    });
};
