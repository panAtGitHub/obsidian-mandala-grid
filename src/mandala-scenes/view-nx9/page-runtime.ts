import {
    applyNx9PageInteractionState,
    assembleNx9PageFrame,
    buildNx9PageIndex,
    buildNx9PageStaticRows,
    patchNx9ActiveInteractionState,
    type Nx9GhostRowViewModel,
    type Nx9InteractionSnapshot,
    type Nx9PageFrameRowViewModel,
    type Nx9PageIndex,
    type Nx9PaddingRowViewModel,
    type Nx9RealCellViewModel,
    type Nx9RowViewModel,
    type Nx9StaticRowViewModel,
} from 'src/mandala-scenes/view-nx9/assemble-cell-view-model';
import type { Nx9PageContext } from 'src/mandala-scenes/view-nx9/context';

type PerfLogger = (
    eventName: string,
    payload: Record<string, unknown>,
) => void;

export const createNx9PageRuntime = ({
    recordPerfEvent,
}: {
    recordPerfEvent?: PerfLogger;
} = {}) => {
    let cachedPageFrame: {
        context: Nx9PageContext;
        sectionIdMap: Record<string, string>;
        value: Nx9PageFrameRowViewModel[];
    } | null = null;
    let cachedPageIndex: {
        pageFrame: Nx9PageFrameRowViewModel[];
        value: Nx9PageIndex;
    } | null = null;
    let cachedStaticRows: {
        pageFrame: Nx9PageFrameRowViewModel[];
        backgroundMode: string;
        sectionColors: Record<string, string>;
        sectionColorOpacity: number;
        whiteThemeMode: boolean;
        hydratedNodeIds: Set<string>;
        value: Nx9StaticRowViewModel[];
    } | null = null;
    let cachedRuntimeRows: {
        staticRows: Nx9StaticRowViewModel[];
        interaction: Nx9InteractionSnapshot;
        value: Nx9RowViewModel[];
    } | null = null;

    const resolvePageFrame = ({
        context,
        sectionIdMap,
    }: {
        context: Nx9PageContext;
        sectionIdMap: Record<string, string>;
    }) => {
        if (
            cachedPageFrame &&
            cachedPageFrame.context === context &&
            cachedPageFrame.sectionIdMap === sectionIdMap
        ) {
            return cachedPageFrame.value;
        }
        const startedAt = performance.now();
        const value = assembleNx9PageFrame({
            context,
            documentState: {
                sections: {
                    section_id: sectionIdMap,
                },
            },
        });
        cachedPageFrame = {
            context,
            sectionIdMap,
            value,
        };
        recordPerfEvent?.('trace.nx9.assemble-rows', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            row_count: value.length,
            page: context.currentPage,
        });
        return value;
    };

    const resolvePageIndex = ({
        pageFrame,
    }: {
        pageFrame: Nx9PageFrameRowViewModel[];
    }) => {
        if (cachedPageIndex?.pageFrame === pageFrame) {
            return cachedPageIndex.value;
        }
        const value = buildNx9PageIndex(pageFrame);
        cachedPageIndex = {
            pageFrame,
            value,
        };
        return value;
    };

    const resolveStaticRows = ({
        context,
        pageFrame,
        sectionColors,
        sectionColorOpacity,
        backgroundMode,
        whiteThemeMode,
        hydratedNodeIds,
    }: {
        context: Nx9PageContext;
        pageFrame: Nx9PageFrameRowViewModel[];
        sectionColors: Record<string, string>;
        sectionColorOpacity: number;
        backgroundMode: string;
        whiteThemeMode: boolean;
        hydratedNodeIds: Set<string>;
    }) => {
        if (
            cachedStaticRows &&
            cachedStaticRows.pageFrame === pageFrame &&
            cachedStaticRows.backgroundMode === backgroundMode &&
            cachedStaticRows.sectionColors === sectionColors &&
            cachedStaticRows.sectionColorOpacity === sectionColorOpacity &&
            cachedStaticRows.whiteThemeMode === whiteThemeMode &&
            cachedStaticRows.hydratedNodeIds === hydratedNodeIds
        ) {
            return cachedStaticRows.value;
        }

        const startedAt = performance.now();
        const value = buildNx9PageStaticRows({
            context,
            pageFrame,
            sectionColors,
            sectionColorOpacity,
            backgroundMode,
            whiteThemeMode,
            hydratedNodeIds,
        });
        cachedStaticRows = {
            pageFrame,
            backgroundMode,
            sectionColors,
            sectionColorOpacity,
            whiteThemeMode,
            hydratedNodeIds,
            value,
        };
        recordPerfEvent?.('trace.nx9.build-static-rows', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            row_count: value.length,
            cell_count: pageFrame.reduce(
                (count, row) => count + (Array.isArray(row) ? row.length : 0),
                0,
            ),
            page: context.currentPage,
        });
        return value;
    };

    const buildInteractionSnapshot = ({
        context,
        activeNodeId,
        activeCell,
        editingState,
        selectedStamp,
        pinnedStamp,
        showDetailSidebar,
    }: {
        context: Nx9PageContext;
        activeNodeId: string | null;
        activeCell: { row: number; col: number; page?: number } | null;
        editingState: { activeNodeId: string | null; isInSidebar: boolean };
        selectedStamp: string;
        pinnedStamp: string;
        showDetailSidebar: boolean;
    }): Nx9InteractionSnapshot => {
        const normalizedActiveCell = activeCell
            ? {
                  row: activeCell.row,
                  col: activeCell.col,
                  page: activeCell.page ?? context.currentPage,
              }
            : null;

        return {
            activeNodeId,
            activeCell: normalizedActiveCell,
            activeCellKey: normalizedActiveCell
                ? `${normalizedActiveCell.page}:${normalizedActiveCell.row}:${normalizedActiveCell.col}`
                : null,
            editingNodeId: editingState.activeNodeId,
            editingInSidebar: editingState.isInSidebar,
            selectedStamp,
            pinnedStamp,
            showDetailSidebar,
        };
    };

    const sameInteractionSnapshot = (
        a: Nx9InteractionSnapshot,
        b: Nx9InteractionSnapshot,
    ) =>
        a.activeNodeId === b.activeNodeId &&
        a.activeCellKey === b.activeCellKey &&
        a.editingNodeId === b.editingNodeId &&
        a.editingInSidebar === b.editingInSidebar &&
        a.selectedStamp === b.selectedStamp &&
        a.pinnedStamp === b.pinnedStamp &&
        a.showDetailSidebar === b.showDetailSidebar;

    const canPatchActiveInteractionState = (
        previousInteraction: Nx9InteractionSnapshot,
        nextInteraction: Nx9InteractionSnapshot,
    ) => {
        const nonActiveStable =
            previousInteraction.editingNodeId ===
                nextInteraction.editingNodeId &&
            previousInteraction.editingInSidebar ===
                nextInteraction.editingInSidebar &&
            previousInteraction.selectedStamp ===
                nextInteraction.selectedStamp &&
            previousInteraction.pinnedStamp === nextInteraction.pinnedStamp &&
            previousInteraction.showDetailSidebar ===
                nextInteraction.showDetailSidebar;

        const activeChanged =
            previousInteraction.activeNodeId !== nextInteraction.activeNodeId ||
            previousInteraction.activeCellKey !== nextInteraction.activeCellKey;

        return nonActiveStable && activeChanged;
    };

    const resolveRuntimeRows = ({
        staticRows,
        pageIndex,
        context,
        activeNodeId,
        activeCell,
        editingState,
        selectedNodes,
        selectedStamp,
        pinnedSections,
        pinnedStamp,
        showDetailSidebar,
    }: {
        staticRows: Nx9StaticRowViewModel[];
        pageIndex: Nx9PageIndex;
        context: Nx9PageContext;
        activeNodeId: string | null;
        activeCell: { row: number; col: number; page?: number } | null;
        editingState: { activeNodeId: string | null; isInSidebar: boolean };
        selectedNodes: Set<string>;
        selectedStamp: string;
        pinnedSections: Set<string>;
        pinnedStamp: string;
        showDetailSidebar: boolean;
    }) => {
        const interaction = buildInteractionSnapshot({
            context,
            activeNodeId,
            activeCell,
            editingState,
            selectedStamp,
            pinnedStamp,
            showDetailSidebar,
        });

        if (
            cachedRuntimeRows &&
            cachedRuntimeRows.staticRows === staticRows &&
            sameInteractionSnapshot(cachedRuntimeRows.interaction, interaction)
        ) {
            return cachedRuntimeRows.value;
        }

        if (
            cachedRuntimeRows &&
            cachedRuntimeRows.staticRows === staticRows &&
            canPatchActiveInteractionState(
                cachedRuntimeRows.interaction,
                interaction,
            )
        ) {
            const startedAt = performance.now();
            const patched = patchNx9ActiveInteractionState({
                rows: cachedRuntimeRows.value,
                staticRows,
                pageIndex,
                context,
                previousInteraction: cachedRuntimeRows.interaction,
                nextInteraction: interaction,
            });
            cachedRuntimeRows = {
                staticRows,
                interaction,
                value: patched.rows,
            };
            recordPerfEvent?.('trace.nx9.patch-active-state', {
                total_ms: Number((performance.now() - startedAt).toFixed(2)),
                changed_row_count: patched.changedRowCount,
                changed_cell_count: patched.changedCellCount,
                page: context.currentPage,
            });
            return patched.rows;
        }

        const startedAt = performance.now();
        const value = applyNx9PageInteractionState({
            context,
            staticRows,
            activeNodeId,
            activeCell,
            editingState,
            selectedNodes,
            pinnedSections,
            showDetailSidebar,
        });
        cachedRuntimeRows = {
            staticRows,
            interaction,
            value,
        };
        recordPerfEvent?.('trace.nx9.apply-ui-full', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            row_count: value.length,
            cell_count: pageIndex.nodeIds.length,
            page: context.currentPage,
        });
        return value;
    };

    return {
        resolvePageFrame,
        resolvePageIndex,
        resolveStaticRows,
        resolveRuntimeRows,
    };
};

export const isGhostNx9Row = (
    row: Nx9RowViewModel,
): row is Nx9GhostRowViewModel =>
    !Array.isArray(row) && row.kind === 'ghost-row';

export const isPaddingNx9Row = (
    row: Nx9RowViewModel,
): row is Nx9PaddingRowViewModel =>
    !Array.isArray(row) && row.kind === 'padding-row';

export const isRealNx9Row = (
    row: Nx9RowViewModel,
): row is Nx9RealCellViewModel[] => Array.isArray(row);
