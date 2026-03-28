<script lang="ts">
    import { onDestroy } from 'svelte';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import {
        type Nx9PageContext,
        type Nx9StructureContext,
    } from 'src/mandala-scenes/view-nx9/context';
    import { createNx9ContextRuntime } from 'src/mandala-scenes/view-nx9/context-runtime';
    import {
        type Nx9PageFrameRowViewModel,
        type Nx9PageIndex,
        type Nx9RowViewModel,
        type Nx9StaticRowViewModel,
    } from 'src/mandala-scenes/view-nx9/assemble-cell-view-model';
    import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
    import MandalaCard from 'src/mandala-cell/view/components/mandala-card.svelte';
    import Nx9NextCoreCell from 'src/mandala-scenes/view-nx9/nx9-next-core-cell.svelte';
    import {
        createNx9HydrationRuntime,
        resolveNx9FutureScale,
    } from 'src/mandala-scenes/view-nx9/hydration-runtime';
    import {
        createNx9PageRuntime,
        isGhostNx9Row,
        isPaddingNx9Row,
        isRealNx9Row,
    } from 'src/mandala-scenes/view-nx9/page-runtime';
    import { createNx9SelectionRuntime } from 'src/mandala-scenes/view-nx9/selection-runtime';

    const view = getView();
    const contextRuntime = createNx9ContextRuntime({
        recordPerfEvent: view.recordPerfEvent.bind(view),
    });
    const hydrationRuntime = createNx9HydrationRuntime({
        recordPerfEvent: view.recordPerfEvent.bind(view),
    });
    const pageRuntime = createNx9PageRuntime({
        recordPerfEvent: view.recordPerfEvent.bind(view),
    });
    const selectionRuntime = createNx9SelectionRuntime({
        view,
        getCurrentPage: () => nx9Context.currentPage,
    });
    let rows: Nx9RowViewModel[] = [];
    let staticRows: Nx9StaticRowViewModel[] = [];
    let currentPage = 0;
    let rowCount = 1;
    let futureScale = 1;
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
    export let documentSnapshot: {
        revision: number;
        contentRevision: number;
        sectionIdMap: Record<string, string>;
        documentContent: Record<string, { content?: string }>;
    } = {
        revision: 0,
        contentRevision: 0,
        sectionIdMap: {},
        documentContent: {},
    };
    export let rowsPerPage = 5;
    export let displaySnapshot = {
        sectionColors: {} as Record<string, string>,
        sectionColorOpacity: 0,
        backgroundMode: 'none',
        showDetailSidebar: false,
        whiteThemeMode: false,
    };
    export let interactionSnapshot = {
        activeNodeId: null as string | null,
        editingState: {
            activeNodeId: null as string | null,
            isInSidebar: false,
        },
        selectedNodes: new Set<string>(),
        selectedStamp: '',
        pinnedSections: new Set<string>(),
        pinnedStamp: '',
    };
    export let activeSection: string | null = null;
    export let activeCoreSection: string | null = null;
    export let activeCell: { row: number; col: number; page?: number } | null =
        null;

    onDestroy(() => {
        hydrationRuntime.dispose();
    });

    $: structureContext = contextRuntime.resolveStructureContext({
        documentSnapshot,
        rowsPerPage,
        activeSection: activeCoreSection,
    });
    $: nx9Context = contextRuntime.resolvePageContext({
        structureContext,
        activeSection,
        activeCell,
    });
    $: currentPage = nx9Context.currentPage;
    $: rowCount = nx9Context.rowsPerPage;
    $: futureScale = resolveNx9FutureScale(rowCount);
    $: pageFrame = pageRuntime.resolvePageFrame({
        context: nx9Context,
        sectionIdMap: documentSnapshot.sectionIdMap,
    });
    $: pageIndex = pageRuntime.resolvePageIndex({ pageFrame });
    $: hydratedNodeIds = hydrationRuntime.sync({
        revision: documentSnapshot.revision,
        currentPage,
        rowCount,
        pageFrame,
        activeNodeId: interactionSnapshot.activeNodeId,
    });
    $: staticRows = pageRuntime.resolveStaticRows({
        context: nx9Context,
        pageFrame,
        sectionColors: displaySnapshot.sectionColors,
        sectionColorOpacity: displaySnapshot.sectionColorOpacity,
        backgroundMode: displaySnapshot.backgroundMode,
        whiteThemeMode: displaySnapshot.whiteThemeMode,
        hydratedNodeIds,
    });
    $: rows = pageRuntime.resolveRuntimeRows({
        staticRows,
        pageIndex,
        context: nx9Context,
        activeNodeId: interactionSnapshot.activeNodeId,
        activeCell,
        editingState: interactionSnapshot.editingState,
        selectedNodes: interactionSnapshot.selectedNodes,
        selectedStamp: interactionSnapshot.selectedStamp,
        pinnedSections: interactionSnapshot.pinnedSections,
        pinnedStamp: interactionSnapshot.pinnedStamp,
        showDetailSidebar: displaySnapshot.showDetailSidebar,
    });

</script>

<div
    class="nx9-grid mandala-grid mandala-grid--nx9"
    style={`--nx9-rows-per-page: ${rowCount}; --nx9-font-size: var(--mandala-font-7x9, var(--mandala-font-3x3)); --nx9-future-scale: ${futureScale};`}
>
    {#each rows as rowModel, rowIndex (`${currentPage}-${rowIndex}`)}
        {#if isRealNx9Row(rowModel)}
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
                        selectionRuntime.selectRealCell(
                            cell.row,
                            cell.col,
                            cell.nodeId,
                        )}
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
        {:else if isGhostNx9Row(rowModel)}
            <div
                class="nx9-cell mandala-cell nx9-cell--future-row nx9-cell--future-row-active"
                class:nx9-cell--future-row-with-hint={rowModel.showFutureHint}
                class:is-top-edge={rowModel.isTopEdge}
                class:is-bottom-edge={rowModel.isBottomEdge}
                class:is-left-edge={true}
                class:is-right-edge={true}
                class:is-active-cell={rowModel.isActiveCell}
                style={`grid-row: ${rowModel.row + 1}; grid-column: 1 / 10;`}
                on:click={() =>
                    selectionRuntime.selectGhostCreateCell(rowModel.row)}
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
        {:else if isPaddingNx9Row(rowModel)}
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
