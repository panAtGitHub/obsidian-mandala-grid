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
    import {
        resolveCardGridStyle,
        type ResolvedGridStyle,
    } from 'src/mandala-scenes/shared/grid-style';
    import Nx9NextCoreCell from 'src/mandala-scenes/view-nx9/nx9-next-core-cell.svelte';
    import {
        createNx9HydrationRuntime,
        type Nx9HydrationSnapshot,
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
        onHydrationChange: () => {
            hydrationVersion += 1;
        },
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
    let hotPages: number[] = [];
    let rowCount = 1;
    let futureScale = 1;
    let structureContext: Nx9StructureContext;
    let nx9Context: Nx9PageContext;
    let currentPageContext: Nx9PageContext;
    let pageContextsByPage = new Map<number, Nx9PageContext>();
    let pageFramesByPage = new Map<number, Nx9PageFrameRowViewModel[]>();
    let pageFrame: Nx9PageFrameRowViewModel[] = [];
    let pageIndex: Nx9PageIndex = {
        cellByKey: {},
        cellByPosition: {},
        positionByNodeId: {},
        nodeIds: [],
    };
    let hydrationVersion = 0;
    let hydrationSnapshot: Nx9HydrationSnapshot = {
        hydratedNodeIdsByPage: new Map(),
        hotPages: new Set(),
    };
    let hydratedNodeIds = new Set<string>();
    export let themeSnapshot: MandalaThemeSnapshot = {
        themeTone: 'light',
        themeUnderlayColor: '',
        activeThemeUnderlayColor: '',
    };
    export let gridStyle: ResolvedGridStyle = resolveCardGridStyle({
        whiteThemeMode: false,
        selectionStyle: 'cell-outline',
    });
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

    const resolveHotPages = (page: number, totalPages: number) =>
        [page - 1, page, page + 1].filter(
            (candidate, index, all) =>
                candidate >= 0 &&
                candidate < totalPages &&
                all.indexOf(candidate) === index,
        );

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
    $: hotPages = resolveHotPages(currentPage, nx9Context.totalPages);
    $: pageContextsByPage = new Map(
        hotPages.map((page) => [
            page,
            contextRuntime.resolvePageContext({
                structureContext,
                activeSection,
                activeCell,
                requestedPage: page,
            }),
        ]),
    );
    $: currentPageContext = pageContextsByPage.get(currentPage) ?? nx9Context;
    $: rowCount = nx9Context.rowsPerPage;
    $: futureScale = resolveNx9FutureScale(rowCount);
    $: pageFramesByPage = new Map(
        hotPages.map((page) => [
            page,
            pageRuntime.resolvePageFrame({
                page,
                context: pageContextsByPage.get(page) ?? nx9Context,
                sectionIdMap: documentSnapshot.sectionIdMap,
            }),
        ]),
    );
    $: pageFrame = pageFramesByPage.get(currentPage) ?? [];
    $: pageIndex = pageRuntime.resolvePageIndex({
        page: currentPage,
        pageFrame,
    });
    $: hydrationSnapshot = (() => {
        hydrationVersion;
        return hydrationRuntime.sync({
            revision: documentSnapshot.revision,
            currentPage,
            rowCount,
            hotPages,
            pageFramesByPage,
        });
    })();
    $: hydratedNodeIds =
        hydrationSnapshot.hydratedNodeIdsByPage.get(currentPage) ??
        new Set<string>();
    $: pageRuntime.prewarmPages({
        pages: hotPages.map((page) => ({
            page,
            context: pageContextsByPage.get(page) ?? nx9Context,
            sectionIdMap: documentSnapshot.sectionIdMap,
            hydratedNodeIds:
                hydrationSnapshot.hydratedNodeIdsByPage.get(page) ??
                new Set<string>(),
        })),
        displaySnapshot,
        gridStyle,
        interactionSnapshot,
        activeCell,
    });
    $: staticRows = pageRuntime.resolveStaticRows({
        page: currentPage,
        context: currentPageContext,
        pageFrame,
        displaySnapshot,
        gridStyle,
        hydratedNodeIds,
    });
    $: rows = pageRuntime.resolveRuntimeRows({
        page: currentPage,
        staticRows,
        pageIndex,
        context: currentPageContext,
        interactionSnapshot,
        activeCell,
        displaySnapshot,
    });

</script>

<div
    class="nx9-grid mandala-grid mandala-grid--nx9 mandala-card-grid"
    class:is-compact={gridStyle.compactMode}
    style={`--nx9-rows-per-page: ${rowCount}; --nx9-font-size: var(--mandala-font-7x9, var(--mandala-font-3x3)); --nx9-future-scale: ${futureScale};`}
>
    {#each rows as rowModel, rowIndex (`${currentPage}-${rowIndex}`)}
        {#if isRealNx9Row(rowModel)}
            {#each rowModel as cell (cell.key)}
                <div
                    class="nx9-cell mandala-cell mandala-card-grid__cell"
                    class:mandala-card-grid__cell--card={!!cell.cardViewModel}
                    class:mandala-card-grid__cell--empty={!cell.nodeId}
                    class:nx9-cell--desktop-card={!!cell.cardViewModel}
                    class:is-clickable={!!cell.nodeId}
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
                        <div class="mandala-card-grid__empty">{cell.section}</div>
                    {/if}
                </div>
            {/each}
        {:else if isGhostNx9Row(rowModel)}
            <div
                class="nx9-cell mandala-cell mandala-card-grid__cell nx9-cell--future-row nx9-cell--future-row-active"
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
                class="nx9-cell mandala-cell mandala-card-grid__cell nx9-cell--future-row nx9-cell--future-row-muted"
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
        align-items: stretch;
        justify-items: stretch;
    }

    .nx9-cell.is-clickable,
    .nx9-cell--future-row-active {
        cursor: pointer;
    }

    .nx9-cell--desktop-card {
        --mandala-card-font-size: var(--nx9-font-size);
    }

    .nx9-cell--future-row {
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
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
</style>
