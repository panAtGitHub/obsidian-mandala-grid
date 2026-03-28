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
import type {
    SceneCardInteractionSnapshot,
    SceneDisplaySnapshot,
} from 'src/mandala-scenes/shared/scene-projection';

type PerfLogger = (
    eventName: string,
    payload: Record<string, unknown>,
) => void;

export const createNx9PageRuntime = ({
    recordPerfEvent,
}: {
    recordPerfEvent?: PerfLogger;
} = {}) => {
    type StaticRowsCacheEntry = {
        pageFrame: Nx9PageFrameRowViewModel[];
        backgroundMode: string;
        sectionColors: Record<string, string>;
        sectionColorOpacity: number;
        whiteThemeMode: boolean;
        hydratedNodeIds: Set<string>;
        value: Nx9StaticRowViewModel[];
    };

    type RuntimeRowsCacheEntry = {
        staticRows: Nx9StaticRowViewModel[];
        interaction: Nx9InteractionSnapshot;
        value: Nx9RowViewModel[];
    };

    type Nx9PageCacheEntry = {
        context: Nx9PageContext | null;
        sectionIdMap: Record<string, string> | null;
        pageFrame: Nx9PageFrameRowViewModel[] | null;
        pageIndexFrame: Nx9PageFrameRowViewModel[] | null;
        pageIndex: Nx9PageIndex | null;
        staticRowsCache: StaticRowsCacheEntry[];
        runtimeRowsCache: RuntimeRowsCacheEntry[];
    };

    const pageCache = new Map<number, Nx9PageCacheEntry>();

    const getPageCacheEntry = (page: number): Nx9PageCacheEntry => {
        const cached = pageCache.get(page);
        if (cached) {
            return cached;
        }
        const entry: Nx9PageCacheEntry = {
            context: null,
            sectionIdMap: null,
            pageFrame: null,
            pageIndexFrame: null,
            pageIndex: null,
            staticRowsCache: [],
            runtimeRowsCache: [],
        };
        pageCache.set(page, entry);
        return entry;
    };

    const trimCache = (pagesToKeep: Set<number>) => {
        for (const page of Array.from(pageCache.keys())) {
            if (pagesToKeep.has(page)) continue;
            pageCache.delete(page);
        }
    };

    const resolvePageFrame = ({
        page,
        context,
        sectionIdMap,
    }: {
        page: number;
        context: Nx9PageContext;
        sectionIdMap: Record<string, string>;
    }) => {
        const entry = getPageCacheEntry(page);
        if (entry.context === context && entry.sectionIdMap === sectionIdMap && entry.pageFrame) {
            return entry.pageFrame;
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
        entry.context = context;
        entry.sectionIdMap = sectionIdMap;
        entry.pageFrame = value;
        entry.pageIndexFrame = null;
        entry.pageIndex = null;
        entry.staticRowsCache = [];
        entry.runtimeRowsCache = [];
        recordPerfEvent?.('trace.nx9.assemble-rows', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            row_count: value.length,
            page,
        });
        return value;
    };

    const resolvePageIndex = ({
        page,
        pageFrame,
    }: {
        page: number;
        pageFrame: Nx9PageFrameRowViewModel[];
    }) => {
        const entry = getPageCacheEntry(page);
        if (entry.pageIndexFrame === pageFrame && entry.pageIndex) {
            return entry.pageIndex;
        }
        const value = buildNx9PageIndex(pageFrame);
        entry.pageIndexFrame = pageFrame;
        entry.pageIndex = value;
        return value;
    };

    const resolveStaticRows = ({
        page,
        context,
        pageFrame,
        displaySnapshot,
        hydratedNodeIds,
    }: {
        page: number;
        context: Nx9PageContext;
        pageFrame: Nx9PageFrameRowViewModel[];
        displaySnapshot: SceneDisplaySnapshot;
        hydratedNodeIds: Set<string>;
    }) => {
        const entry = getPageCacheEntry(page);
        const cached = entry.staticRowsCache.find(
            (candidate) =>
                candidate.pageFrame === pageFrame &&
                candidate.backgroundMode === displaySnapshot.backgroundMode &&
                candidate.sectionColors === displaySnapshot.sectionColors &&
                candidate.sectionColorOpacity ===
                    displaySnapshot.sectionColorOpacity &&
                candidate.whiteThemeMode === displaySnapshot.whiteThemeMode &&
                candidate.hydratedNodeIds === hydratedNodeIds,
        );
        if (cached) {
            return cached.value;
        }

        const startedAt = performance.now();
        const value = buildNx9PageStaticRows({
            context,
            pageFrame,
            displaySnapshot,
            hydratedNodeIds,
        });
        entry.staticRowsCache.push({
            pageFrame,
            backgroundMode: displaySnapshot.backgroundMode,
            sectionColors: displaySnapshot.sectionColors,
            sectionColorOpacity: displaySnapshot.sectionColorOpacity,
            whiteThemeMode: displaySnapshot.whiteThemeMode,
            hydratedNodeIds,
            value,
        });
        recordPerfEvent?.('trace.nx9.build-static-rows', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            row_count: value.length,
            cell_count: pageFrame.reduce(
                (count, row) => count + (Array.isArray(row) ? row.length : 0),
                0,
            ),
            page,
        });
        return value;
    };

    const buildInteractionSnapshot = ({
        context,
        interactionSnapshot,
        activeCell,
        displaySnapshot,
    }: {
        context: Nx9PageContext;
        interactionSnapshot: SceneCardInteractionSnapshot;
        activeCell: { row: number; col: number; page?: number } | null;
        displaySnapshot: SceneDisplaySnapshot;
    }): Nx9InteractionSnapshot => {
        const normalizedActiveCell = activeCell
            ? {
                  row: activeCell.row,
                  col: activeCell.col,
                  page: activeCell.page ?? context.currentPage,
              }
            : null;

        return {
            activeNodeId: interactionSnapshot.activeNodeId,
            activeCell: normalizedActiveCell,
            activeCellKey: normalizedActiveCell
                ? `${normalizedActiveCell.page}:${normalizedActiveCell.row}:${normalizedActiveCell.col}`
                : null,
            editingNodeId: interactionSnapshot.editingState.activeNodeId,
            editingInSidebar: interactionSnapshot.editingState.isInSidebar,
            selectedStamp: interactionSnapshot.selectedStamp,
            pinnedStamp: interactionSnapshot.pinnedStamp,
            showDetailSidebar: displaySnapshot.showDetailSidebar,
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
        page,
        staticRows,
        pageIndex,
        context,
        interactionSnapshot,
        activeCell,
        displaySnapshot,
    }: {
        page: number;
        staticRows: Nx9StaticRowViewModel[];
        pageIndex: Nx9PageIndex;
        context: Nx9PageContext;
        interactionSnapshot: SceneCardInteractionSnapshot;
        activeCell: { row: number; col: number; page?: number } | null;
        displaySnapshot: SceneDisplaySnapshot;
    }) => {
        const entry = getPageCacheEntry(page);
        const interaction = buildInteractionSnapshot({
            context,
            interactionSnapshot,
            activeCell,
            displaySnapshot,
        });
        const runtimeCache = entry.runtimeRowsCache.find(
            (candidate) => candidate.staticRows === staticRows,
        );

        if (
            runtimeCache &&
            sameInteractionSnapshot(runtimeCache.interaction, interaction)
        ) {
            return runtimeCache.value;
        }

        if (
            runtimeCache &&
            canPatchActiveInteractionState(
                runtimeCache.interaction,
                interaction,
            )
        ) {
            const startedAt = performance.now();
            const patched = patchNx9ActiveInteractionState({
                rows: runtimeCache.value,
                staticRows,
                pageIndex,
                context,
                previousInteraction: runtimeCache.interaction,
                nextInteraction: interaction,
            });
            runtimeCache.interaction = interaction;
            runtimeCache.value = patched.rows;
            recordPerfEvent?.('trace.nx9.patch-active-state', {
                total_ms: Number((performance.now() - startedAt).toFixed(2)),
                changed_row_count: patched.changedRowCount,
                changed_cell_count: patched.changedCellCount,
                page,
            });
            return patched.rows;
        }

        const startedAt = performance.now();
        const value = applyNx9PageInteractionState({
            context,
            staticRows,
            displaySnapshot,
            interactionSnapshot,
            activeCell,
        });
        if (runtimeCache) {
            runtimeCache.interaction = interaction;
            runtimeCache.value = value;
        } else {
            entry.runtimeRowsCache.push({
                staticRows,
                interaction,
                value,
            });
        }
        recordPerfEvent?.('trace.nx9.apply-ui-full', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            row_count: value.length,
            cell_count: pageIndex.nodeIds.length,
            page,
        });
        return value;
    };

    const prewarmPages = ({
        pages,
        displaySnapshot,
        interactionSnapshot,
        activeCell,
    }: {
        pages: Array<{
            page: number;
            context: Nx9PageContext;
            sectionIdMap: Record<string, string>;
            hydratedNodeIds: Set<string>;
        }>;
        displaySnapshot: SceneDisplaySnapshot;
        interactionSnapshot: SceneCardInteractionSnapshot;
        activeCell: { row: number; col: number; page?: number } | null;
    }) => {
        const hotPages = new Set<number>();

        for (const pageEntry of pages) {
            hotPages.add(pageEntry.page);
            const pageFrame = resolvePageFrame({
                page: pageEntry.page,
                context: pageEntry.context,
                sectionIdMap: pageEntry.sectionIdMap,
            });
            const pageIndex = resolvePageIndex({
                page: pageEntry.page,
                pageFrame,
            });
            const staticRows = resolveStaticRows({
                page: pageEntry.page,
                context: pageEntry.context,
                pageFrame,
                displaySnapshot,
                hydratedNodeIds: pageEntry.hydratedNodeIds,
            });
            resolveRuntimeRows({
                page: pageEntry.page,
                staticRows,
                pageIndex,
                context: pageEntry.context,
                interactionSnapshot,
                activeCell,
                displaySnapshot,
            });
        }

        trimCache(hotPages);
    };

    return {
        resolvePageFrame,
        resolvePageIndex,
        resolveStaticRows,
        resolveRuntimeRows,
        prewarmPages,
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
