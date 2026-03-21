<script lang="ts">
    import { derived } from 'src/lib/store/derived';
    import {
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        ShowMandalaDetailSidebarStore,
        WhiteThemeModeStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { SectionColorBySectionStore } from 'src/stores/cell/section-colors-store';
    import { PinnedSectionsStore } from 'src/stores/cell/document-derived-stores';
    import { getView } from 'src/views/shared/shell/context';
    import MandalaCard from 'src/cell/view/components/mandala-card.svelte';
    import Nx9NextCoreCell from 'src/views/view-nx9/nx9-next-core-cell.svelte';
    import { resolveCustomSectionColor } from 'src/lib/mandala/section-colors';
    import type { Nx9Context } from 'src/view/helpers/mandala/nx9/context';
    import { setActiveCellNx9 } from 'src/view/helpers/mandala/nx9/set-active-cell';
    import { buildMandalaCardViewModel } from 'src/cell/model/build-mandala-card-view-model';
    import { buildCellDisplayPolicy } from 'src/cell/model/cell-display-policy';
    import { buildCellInteractionPolicy } from 'src/cell/viewmodel/policies/cell-interaction-policy';

    export let context: Nx9Context;

    const view = getView();
    const documentState = derived(view.documentStore, (state) => state);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const mandalaUiState = derived(view.viewStore, (state) => state.ui.mandala);
    const editingState = derived(
        view.viewStore,
        (state) => state.document.editing,
    );
    const selectedNodes = derived(
        view.viewStore,
        (state) => state.document.selectedNodes,
    );
    const pinnedSections = PinnedSectionsStore(view);
    const sectionColors = SectionColorBySectionStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);

    $: activeCell = $mandalaUiState.activeCellNx9;
    $: pageRows = context.pageRows;
    $: rowCount = context.rowsPerPage;
    $: futureScale =
        rowCount <= 5 ? 1 : Math.max(0.58, Math.min(1, 5 / rowCount));
    $: showFutureHint = rowCount <= 5;

    const getSectionColor = (section: string | null) => {
        return resolveCustomSectionColor({
            section,
            backgroundMode: $backgroundMode,
            sectionColorsBySection: $sectionColors,
            sectionColorOpacity: $sectionColorOpacity,
        });
    };

    const isActiveCell = (row: number, col: number) =>
        !!activeCell &&
        activeCell.row === row &&
        activeCell.col === col &&
        (activeCell.page ?? context.currentPage) === context.currentPage;

    const selectGhostCreateCell = (row: number) => {
        setActiveCellNx9(view, {
            row,
            col: 0,
            page: context.currentPage,
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
            page: context.currentPage,
        });
    };
</script>

<div
    class="nx9-grid mandala-grid mandala-grid--nx9"
    style={`--nx9-rows-per-page: ${rowCount}; --nx9-font-size: var(--mandala-font-7x9, var(--mandala-font-3x3)); --nx9-future-scale: ${futureScale};`}
>
    {#each pageRows as rowModel, row (`${context.currentPage}-${row}`)}
        {#if rowModel.kind === 'real-core-row'}
            {#each Array.from({ length: 9 }, (_, index) => index) as col (col)}
                {@const section =
                    col === 0
                        ? rowModel.coreSection
                        : `${rowModel.coreSection}.${col}`}
                {@const nodeId =
                    $documentState.sections.section_id[section] ?? null}
                <div
                    class="nx9-cell mandala-cell nx9-cell--desktop-card"
                    class:is-clickable={!!nodeId}
                    class:is-empty-section={!nodeId}
                    class:is-top-edge={row === 0}
                    class:is-bottom-edge={row === rowCount - 1}
                    class:is-left-edge={col === 0}
                    class:is-right-edge={col === 8}
                    class:is-active-cell={isActiveCell(row, col)}
                    class:is-active-node={!activeCell &&
                        !!nodeId &&
                        nodeId === $activeNodeId}
                    style={`grid-row: ${row + 1}; grid-column: ${col + 1};`}
                    on:click|capture={() => selectRealCell(row, col, nodeId)}
                >
                    {#if nodeId}
                        {@const cardViewModel = buildMandalaCardViewModel({
                            nodeId,
                            section,
                            active: nodeId === $activeNodeId,
                            editing:
                                $editingState.activeNodeId === nodeId &&
                                !$editingState.isInSidebar &&
                                !$showDetailSidebar,
                            selected: $selectedNodes.has(nodeId),
                            pinned: $pinnedSections.has(section),
                            style: undefined,
                            sectionColor: getSectionColor(section),
                            displayPolicy: buildCellDisplayPolicy({
                                preset: 'grid-nx9',
                                whiteThemeMode: $whiteThemeMode,
                            }),
                            interactionPolicy: buildCellInteractionPolicy({
                                preset: 'grid-nx9',
                            }),
                            gridCell: {
                                mode: 'nx9',
                                row,
                                col,
                                page: context.currentPage,
                            },
                        })}
                        <MandalaCard {...cardViewModel} />
                    {:else}
                        <div class="nx9-cell__empty">{section}</div>
                    {/if}
                </div>
            {/each}
        {:else if rowModel.kind === 'ghost-next-core-row'}
            <div
                class="nx9-cell mandala-cell nx9-cell--future-row nx9-cell--future-row-active"
                class:nx9-cell--future-row-with-hint={true}
                class:is-top-edge={row === 0}
                class:is-bottom-edge={row === rowCount - 1}
                class:is-left-edge={true}
                class:is-right-edge={true}
                class:is-active-cell={isActiveCell(row, 0)}
                style={`grid-row: ${row + 1}; grid-column: 1 / 10;`}
                on:click={() => selectGhostCreateCell(row)}
            >
                <div class="nx9-cell__future-stack">
                    <div class="nx9-cell__future-surface">
                        <Nx9NextCoreCell
                            nextCoreSection={rowModel.nextCoreSection}
                            tone="accent"
                        />
                    </div>
                    {#if showFutureHint}
                        <div class="nx9-cell__future-hint">
                            仅当前一个核心九宫格的中心格已填写内容时，才能创建新的核心九宫格。
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div
                class="nx9-cell mandala-cell nx9-cell--future-row nx9-cell--future-row-muted"
                class:is-top-edge={row === 0}
                class:is-bottom-edge={row === rowCount - 1}
                class:is-left-edge={true}
                class:is-right-edge={true}
                style={`grid-row: ${row + 1}; grid-column: 1 / 10;`}
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

    .nx9-cell--desktop-card :global(.lng-prev),
    .nx9-cell--desktop-card :global(.editor-container),
    .nx9-cell--desktop-card :global(.mandala-inline-editor),
    .nx9-cell--desktop-card :global(.markdown-source-view),
    .nx9-cell--desktop-card :global(.view-content) {
        flex: 1 1 auto;
        width: 100%;
        min-height: 0;
        min-width: 0;
        height: 100%;
    }

    .nx9-cell--desktop-card :global(.lng-prev) {
        overflow: auto;
    }

    .nx9-cell--desktop-card :global(.editor-container),
    .nx9-cell--desktop-card :global(.mandala-inline-editor),
    .nx9-cell--desktop-card :global(.markdown-source-view),
    .nx9-cell--desktop-card :global(.view-content) {
        display: flex;
        flex-direction: column;
    }

    .nx9-cell--desktop-card :global(.editor-container) {
        overflow: hidden;
    }

    .nx9-cell--desktop-card :global(.cm-editor),
    .nx9-cell--desktop-card :global(.cm-editor .cm-scroller) {
        width: 100%;
        height: 100%;
        min-width: 0;
    }

    .nx9-cell--desktop-card :global(.cm-editor .cm-scroller) {
        overflow: auto !important;
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
