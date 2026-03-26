<script lang="ts">
    import { onDestroy } from 'svelte';
    import { derivedEq } from 'src/shared/store/derived';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import {
        resolveNx9PageContext,
        resolveNx9StructureContext,
        type Nx9PageContext,
        type Nx9StructureContext,
    } from 'src/mandala-scenes/view-nx9/context';
    import { setActiveCellNx9 } from 'src/mandala-scenes/view-nx9/set-active-cell';
    import {
        applyNx9PageInteractionState,
        assembleNx9PageFrame,
        buildNx9PageIndex,
        buildNx9PageStaticRows,
        collectNx9HydratableNodeIds,
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
    import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
    import MandalaCard from 'src/mandala-cell/view/components/mandala-card.svelte';
    import Nx9NextCoreCell from 'src/mandala-scenes/view-nx9/nx9-next-core-cell.svelte';

    const view = getView();
    const documentSnapshot = derivedEq(
        view.documentStore,
        (state) => ({
            revision: state.meta.mandalaV2.revision,
            contentRevision: state.meta.mandalaV2.contentRevision,
            sectionIdMap: state.sections.section_id,
            idToSection: state.sections.id_section,
            documentContent: state.document.content,
        }),
        (a, b) =>
            a.revision === b.revision &&
            a.contentRevision === b.contentRevision,
    );
    let rows: Nx9RowViewModel[] = [];
    let staticRows: Nx9StaticRowViewModel[] = [];
    let currentPage = 0;
    let rowCount = 1;
    let futureScale = 1;
    let activeSection: string | null = null;
    let activeCoreSection: string | null = null;
    let structureContext: Nx9StructureContext;
    let nx9Context: Nx9PageContext;
    let pageFrame: Nx9PageFrameRowViewModel[] = [];
    let pageIndex: Nx9PageIndex = {
        cellByKey: {},
        cellByPosition: {},
        positionByNodeId: {},
        nodeIds: [],
    };
    let hydratedNodeIds = new Set<string>();
    export let themeSnapshot: MandalaThemeSnapshot = {
        themeTone: 'light',
        themeUnderlayColor: '',
        activeThemeUnderlayColor: '',
    };
    export let rowsPerPage = 5;
    export let sectionColors: Record<string, string> = {};
    export let sectionColorOpacity = 0;
    export let backgroundMode = 'none';
    export let showDetailSidebar = false;
    export let whiteThemeMode = false;
    export let activeNodeId: string | null = null;
    export let activeCell: { row: number; col: number; page?: number } | null =
        null;
    export let editingState: {
        activeNodeId: string | null;
        isInSidebar: boolean;
    } = {
        activeNodeId: null,
        isInSidebar: false,
    };
    export let selectedNodes: Set<string> = new Set();
    export let pinnedSections: Set<string> = new Set();
    let hydrationMarker = '';
    let hydrationRequestId = 0;
    let selectedStamp = '';
    let pinnedStamp = '';

    let cachedStructureKey = '';
    let cachedStructureContext: Nx9StructureContext | null = null;
    let cachedPageContext: {
        structureContext: Nx9StructureContext;
        requestedPage: number;
        value: Nx9PageContext;
    } | null = null;
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

    const resolveCachedStructureContext = ({
        sectionIdMap,
        documentContent,
        rowsPerPage,
        activeSection,
        revision,
        contentRevision,
    }: {
        sectionIdMap: Record<string, string>;
        documentContent: Record<string, { content?: string }>;
        rowsPerPage: number;
        activeSection: string | null;
        revision: number;
        contentRevision: number;
    }) => {
        const key = [
            revision,
            contentRevision,
            rowsPerPage,
            activeSection?.split('.')[0] ?? '',
        ].join('|');
        if (key === cachedStructureKey && cachedStructureContext) {
            return cachedStructureContext;
        }
        const startedAt = performance.now();
        cachedStructureContext = resolveNx9StructureContext({
            sectionIdMap,
            documentContent,
            rowsPerPage,
            activeSection,
        });
        cachedStructureKey = key;
        view.recordPerfEvent('trace.nx9.resolve-context', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            rows_per_page: rowsPerPage,
            total_pages: cachedStructureContext.totalPages,
            root_section: activeSection?.split('.')[0] ?? null,
        });
        return cachedStructureContext;
    };

    const resolveCachedPageContext = ({
        structureContext,
        activeSection,
        activeCell,
    }: {
        structureContext: Nx9StructureContext;
        activeSection: string | null;
        activeCell: { row: number; col: number; page?: number } | null;
    }) => {
        const requestedPage =
            activeCell?.page ??
            structureContext.posForSection(activeSection)?.page ??
            0;
        if (
            cachedPageContext &&
            cachedPageContext.structureContext === structureContext &&
            cachedPageContext.requestedPage === requestedPage
        ) {
            return cachedPageContext.value;
        }
        const value = resolveNx9PageContext({
            structureContext,
            activeSection,
            activeCell,
        });
        cachedPageContext = {
            structureContext,
            requestedPage,
            value,
        };
        return value;
    };

    const resolveCachedPageFrame = ({
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
        view.recordPerfEvent('trace.nx9.assemble-rows', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            row_count: value.length,
            page: context.currentPage,
        });
        return value;
    };

    const resolveCachedPageIndex = ({
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

    const resolveCachedStaticRows = ({
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
        view.recordPerfEvent('trace.nx9.build-static-rows', {
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
            view.recordPerfEvent('trace.nx9.patch-active-state', {
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
        view.recordPerfEvent('trace.nx9.apply-ui-full', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            row_count: value.length,
            cell_count: pageIndex.nodeIds.length,
            page: context.currentPage,
        });
        return value;
    };

    const schedulePageHydration = (
        marker: string,
        page: number,
        nodeIds: string[],
    ) => {
        if (nodeIds.length <= hydratedNodeIds.size) return;
        const requestId = ++hydrationRequestId;
        const startedAt = performance.now();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (
                    requestId !== hydrationRequestId ||
                    hydrationMarker !== marker
                ) {
                    return;
                }
                hydratedNodeIds = new Set(nodeIds);
                view.recordPerfEvent('trace.nx9.hydrate-page', {
                    total_ms: Number(
                        (performance.now() - startedAt).toFixed(2),
                    ),
                    page,
                    node_count: nodeIds.length,
                });
            });
        });
    };

    onDestroy(() => {
        hydrationRequestId += 1;
    });

    $: selectedStamp = Array.from(selectedNodes).sort().join('|');
    $: pinnedStamp = Array.from(pinnedSections).sort().join('|');
    $: activeSection = activeNodeId
        ? $documentSnapshot.idToSection[activeNodeId] ?? null
        : null;
    $: activeCoreSection = activeSection?.split('.')[0] ?? null;
    $: structureContext = resolveCachedStructureContext({
        sectionIdMap: $documentSnapshot.sectionIdMap,
        documentContent: $documentSnapshot.documentContent,
        rowsPerPage,
        activeSection: activeCoreSection,
        revision: $documentSnapshot.revision,
        contentRevision: $documentSnapshot.contentRevision,
    });
    $: nx9Context = resolveCachedPageContext({
        structureContext,
        activeSection,
        activeCell,
    });
    $: currentPage = nx9Context.currentPage;
    $: rowCount = nx9Context.rowsPerPage;
    $: futureScale =
        rowCount <= 5 ? 1 : Math.max(0.58, Math.min(1, 5 / rowCount));
    $: pageFrame = resolveCachedPageFrame({
        context: nx9Context,
        sectionIdMap: $documentSnapshot.sectionIdMap,
    });
    $: pageIndex = resolveCachedPageIndex({ pageFrame });
    $: {
        const nodeIds = collectNx9HydratableNodeIds(pageFrame);
        const pageSignature = nodeIds.join('|');
        const marker = [
            $documentSnapshot.revision,
            currentPage,
            rowCount,
            pageSignature,
        ].join('|');
        if (hydrationMarker !== marker) {
            hydrationMarker = marker;
            const initialNodeId =
                nodeIds.find((nodeId) => nodeId === activeNodeId) ??
                nodeIds[0] ??
                null;
            hydratedNodeIds = initialNodeId
                ? new Set([initialNodeId])
                : new Set();
            schedulePageHydration(marker, currentPage, nodeIds);
        } else if (
            activeNodeId &&
            nodeIds.includes(activeNodeId) &&
            !hydratedNodeIds.has(activeNodeId)
        ) {
            hydratedNodeIds = new Set(hydratedNodeIds).add(activeNodeId);
        }
    }
    $: staticRows = resolveCachedStaticRows({
        context: nx9Context,
        pageFrame,
        sectionColors,
        sectionColorOpacity,
        backgroundMode,
        whiteThemeMode,
        hydratedNodeIds,
    });
    $: rows = resolveRuntimeRows({
        staticRows,
        pageIndex,
        context: nx9Context,
        activeNodeId,
        activeCell,
        editingState,
        selectedNodes,
        selectedStamp,
        pinnedSections,
        pinnedStamp,
        showDetailSidebar,
    });

    const selectGhostCreateCell = (row: number) => {
        setActiveCellNx9(view, {
            row,
            col: 0,
            page: nx9Context.currentPage,
        });
    };

    const selectRealCell = (
        row: number,
        col: number,
        nodeId: string | null,
    ) => {
        if (!nodeId) return;
        setActiveCellNx9(view, {
            row,
            col,
            page: nx9Context.currentPage,
        });
    };

    const isGhostRow = (row: Nx9RowViewModel): row is Nx9GhostRowViewModel =>
        !Array.isArray(row) && row.kind === 'ghost-row';
    const isPaddingRow = (
        row: Nx9RowViewModel,
    ): row is Nx9PaddingRowViewModel =>
        !Array.isArray(row) && row.kind === 'padding-row';
    const isRealRow = (row: Nx9RowViewModel): row is Nx9RealCellViewModel[] =>
        Array.isArray(row);
</script>

<div
    class="nx9-grid mandala-grid mandala-grid--nx9"
    style={`--nx9-rows-per-page: ${rowCount}; --nx9-font-size: var(--mandala-font-7x9, var(--mandala-font-3x3)); --nx9-future-scale: ${futureScale};`}
>
    {#each rows as rowModel, rowIndex (`${currentPage}-${rowIndex}`)}
        {#if isRealRow(rowModel)}
            {#each rowModel as cell (cell.key)}
                <div
                    class="nx9-cell mandala-cell nx9-cell--desktop-card"
                    class:is-clickable={!!cell.nodeId}
                    class:is-empty-section={!cell.nodeId}
                    class:is-top-edge={cell.isTopEdge}
                    class:is-bottom-edge={cell.isBottomEdge}
                    class:is-left-edge={cell.isLeftEdge}
                    class:is-right-edge={cell.isRightEdge}
                    class:is-active-cell={cell.isActiveCell}
                    class:is-active-node={cell.isActiveNode}
                    style={`grid-row: ${cell.row + 1}; grid-column: ${cell.col + 1};`}
                    on:click|capture={() =>
                        selectRealCell(cell.row, cell.col, cell.nodeId)}
                >
                    {#if cell.cardViewModel}
                        <MandalaCard
                            viewModel={cell.cardViewModel}
                            uiState={cell.cardUiState}
                            {themeSnapshot}
                        />
                    {:else}
                        <div class="nx9-cell__empty">{cell.section}</div>
                    {/if}
                </div>
            {/each}
        {:else if isGhostRow(rowModel)}
            <div
                class="nx9-cell mandala-cell nx9-cell--future-row nx9-cell--future-row-active"
                class:nx9-cell--future-row-with-hint={rowModel.showFutureHint}
                class:is-top-edge={rowModel.isTopEdge}
                class:is-bottom-edge={rowModel.isBottomEdge}
                class:is-left-edge={true}
                class:is-right-edge={true}
                class:is-active-cell={rowModel.isActiveCell}
                style={`grid-row: ${rowModel.row + 1}; grid-column: 1 / 10;`}
                on:click={() => selectGhostCreateCell(rowModel.row)}
            >
                <div class="nx9-cell__future-stack">
                    <div class="nx9-cell__future-surface">
                        <Nx9NextCoreCell
                            nextCoreSection={rowModel.nextCoreSection}
                            tone="accent"
                        />
                    </div>
                    {#if rowModel.showFutureHint}
                        <div class="nx9-cell__future-hint">
                            仅当前一个核心九宫格的中心格已填写内容时，才能创建新的核心九宫格。
                        </div>
                    {/if}
                </div>
            </div>
        {:else if isPaddingRow(rowModel)}
            <div
                class="nx9-cell mandala-cell nx9-cell--future-row nx9-cell--future-row-muted"
                class:is-top-edge={rowModel.isTopEdge}
                class:is-bottom-edge={rowModel.isBottomEdge}
                class:is-left-edge={true}
                class:is-right-edge={true}
                style={`grid-row: ${rowModel.row + 1}; grid-column: 1 / 10;`}
            >
                <div
                    class="nx9-cell__future-surface nx9-cell__future-surface--muted"
                >
                    <Nx9NextCoreCell
                        nextCoreSection=""
                        tone="muted"
                        disabled={true}
                    />
                </div>
            </div>
        {/if}
    {/each}
</div>

<style>
    .nx9-grid {
        flex: 1 1 auto;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(9, minmax(0, 1fr));
        grid-template-rows: repeat(var(--nx9-rows-per-page), minmax(0, 1fr));
        gap: var(--mandala-gap);
        align-items: stretch;
        justify-items: stretch;
    }

    .nx9-cell {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 0;
        min-width: 0;
        background: transparent;
    }

    .nx9-cell.is-clickable,
    .nx9-cell--future-row-active {
        cursor: pointer;
    }

    .nx9-cell--desktop-card {
        padding: 0;
        --min-node-height: 0;
        --mandala-card-min-height: 0;
        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-font-size: var(--nx9-font-size);
    }

    .nx9-cell--desktop-card :global(.mandala-card) {
        width: 100%;
        height: 100%;
        min-height: 0;
        min-width: 0;
    }

    .nx9-cell.is-empty-section,
    .nx9-cell--future-row {
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        background: color-mix(
            in srgb,
            var(--background-primary) 80%,
            var(--background-modifier-border) 20%
        );
    }

    .nx9-cell--future-row {
        background: color-mix(
            in srgb,
            var(--background-primary) 93%,
            var(--background-modifier-border) 7%
        );
        align-items: center;
        justify-content: center;
    }

    .nx9-cell--future-row-with-hint {
        justify-content: stretch;
    }

    .nx9-cell--future-row-muted {
        background: color-mix(
            in srgb,
            var(--background-primary) 95%,
            var(--background-modifier-border) 5%
        );
    }

    .nx9-cell__future-stack {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: calc(18px * var(--nx9-future-scale))
            calc(24px * var(--nx9-future-scale))
            calc(14px * var(--nx9-future-scale));
        gap: calc(14px * var(--nx9-future-scale));
        box-sizing: border-box;
    }

    .nx9-cell__future-surface {
        display: flex;
        align-items: center;
        justify-content: center;
        width: min(calc(58% * var(--nx9-future-scale)), 980px);
        min-width: 220px;
        height: min(calc(62% * var(--nx9-future-scale)), 160px);
        min-height: calc(84px * var(--nx9-future-scale));
        border-radius: 999px;
        background: color-mix(
            in srgb,
            var(--background-primary) 78%,
            var(--background-modifier-border) 22%
        );
    }

    .nx9-cell__future-surface--muted {
        background: color-mix(
            in srgb,
            var(--background-primary) 84%,
            var(--background-modifier-border) 16%
        );
    }

    .nx9-cell__future-hint {
        max-width: min(72%, 980px);
        text-align: center;
        font-size: calc(13px * var(--nx9-future-scale));
        line-height: 1.45;
        color: var(--text-muted);
        user-select: none;
        flex: 0 0 auto;
    }

    .nx9-cell.is-active-cell,
    .nx9-cell.is-active-node {
        outline: var(--mandala-grid-highlight-width, 2px) solid
            var(--mandala-grid-highlight-color, var(--mandala-color-selection));
        outline-offset: 0;
    }

    .nx9-cell--desktop-card.is-active-cell,
    .nx9-cell--desktop-card.is-active-node {
        outline: none;
    }

    .nx9-cell__empty {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        min-height: 0;
        padding: 10px 8px;
        text-align: center;
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.2;
        user-select: none;
    }

    :global(.mandala-white-theme) .mandala-grid--nx9 {
        gap: 0;
        box-sizing: border-box;
    }

    :global(.mandala-white-theme) .mandala-grid--nx9 > .mandala-cell {
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        box-sizing: border-box;
        overflow: hidden;
        border-radius: 0;
    }

    :global(.mandala-white-theme)
        .mandala-grid--nx9
        > .mandala-cell.is-top-edge {
        border-top: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--nx9
        > .mandala-cell.is-left-edge {
        border-left: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--nx9
        > .mandala-cell.is-right-edge {
        border-right: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--nx9
        > .mandala-cell.is-bottom-edge {
        border-bottom: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme) .nx9-cell :global(.mandala-card) {
        border: 0 !important;
        border-left-width: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
    }
</style>
