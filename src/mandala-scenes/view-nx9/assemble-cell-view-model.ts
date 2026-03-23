import { buildMandalaCardViewModel } from 'src/mandala-cell/model/build-mandala-card-view-model';
import type { MandalaCardViewModel } from 'src/mandala-cell/model/card-view-model';
import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';
import { buildCellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';
import { resolveSectionBackgroundInput } from 'src/mandala-display/logic/section-colors';
import type {
    Nx9Context,
    Nx9PageContext,
} from 'src/mandala-scenes/view-nx9/context';
import type { CellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';
import { buildNx9CellDisplayOverrides } from 'src/mandala-scenes/view-nx9/build-cell-display-overrides';

type Nx9EditingState = {
    activeNodeId: string | null;
    isInSidebar: boolean;
};

type SharedDecorateNx9RowsOptions = {
    context: Nx9PageContext;
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
    hydratedNodeIds: Set<string>;
};

type AssembleNx9RowsOptions = SharedDecorateNx9RowsOptions & {
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
    'isActiveCell' | 'isActiveNode' | 'cardViewModel'
>;

export type Nx9PageFrameRowViewModel =
    | Nx9RealCellFrameViewModel[]
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

const createDisplayPolicy = (whiteThemeMode: boolean): CellDisplayPolicy => ({
    ...createDefaultCellDisplayPolicy(),
    ...buildNx9CellDisplayOverrides({
        whiteThemeMode,
    }),
});

const createInteractionPolicy = (): CellInteractionPolicy =>
    buildCellInteractionPolicy({
        preset: 'grid-nx9',
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

export const decorateNx9PageFrame = ({
    context,
    pageFrame,
    activeNodeId,
    activeCell,
    editingState,
    selectedNodes,
    pinnedSections,
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    whiteThemeMode,
    hydratedNodeIds,
}: SharedDecorateNx9RowsOptions & {
    pageFrame: Nx9PageFrameRowViewModel[];
}): Nx9RowViewModel[] => {
    const displayPolicy = createDisplayPolicy(whiteThemeMode);
    const interactionPolicy = createInteractionPolicy();

    return pageFrame.map((row) => {
        if (!Array.isArray(row)) {
            if (row.kind === 'ghost-row') {
                return {
                    ...row,
                    isActiveCell: isActiveCell(
                        activeCell,
                        row.row,
                        0,
                        context.currentPage,
                    ),
                };
            }
            return row;
        }

        return row.map((cell) => ({
            ...cell,
            isActiveCell: isActiveCell(
                activeCell,
                cell.row,
                cell.col,
                context.currentPage,
            ),
            isActiveNode:
                !activeCell && !!cell.nodeId && cell.nodeId === activeNodeId,
            cardViewModel: cell.nodeId
                ? buildMandalaCardViewModel({
                      nodeId: cell.nodeId,
                      section: cell.section,
                      active: cell.nodeId === activeNodeId,
                      editing:
                          editingState.activeNodeId === cell.nodeId &&
                          !editingState.isInSidebar &&
                          !showDetailSidebar,
                      selected: selectedNodes.has(cell.nodeId),
                      pinned: pinnedSections.has(cell.section),
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
                      gridCell: {
                          mode: 'nx9',
                          row: cell.row,
                          col: cell.col,
                          page: context.currentPage,
                      },
                      contentEnabled: hydratedNodeIds.has(cell.nodeId),
                  })
                : null,
        }));
    });
};

export const assembleNx9Rows = (
    options: AssembleNx9RowsOptions,
): Nx9RowViewModel[] => {
    const pageFrame = assembleNx9PageFrame({
        context: options.context,
        documentState: options.documentState,
    });
    return decorateNx9PageFrame({
        ...options,
        pageFrame,
        hydratedNodeIds: new Set(collectNx9HydratableNodeIds(pageFrame)),
    });
};
