<script lang="ts">
    import { derived } from 'src/lib/store/derived';
    import {
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        ShowMandalaDetailSidebarStore,
        WhiteThemeModeStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { SectionColorBySectionStore } from 'src/stores/document/derived/section-colors-store';
    import { getView } from 'src/view/components/container/context';
    import MandalaCard from 'src/view/components/mandala/mandala-card.svelte';
    import Nx9NextCoreCell from 'src/view/components/mandala/nx9/nx9-next-core-cell.svelte';
    import { applyOpacityToHex } from 'src/view/helpers/mandala/section-colors';
    import type { Nx9Context } from 'src/view/helpers/mandala/nx9/context';
    import { setActiveCellNx9 } from 'src/view/helpers/mandala/nx9/set-active-cell';

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
    const pinnedNodes = derived(
        view.documentStore,
        (state) => new Set(state.pinnedNodes.Ids),
    );
    const sectionColors = SectionColorBySectionStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);

    $: activeCell = $mandalaUiState.activeCellNx9;
    $: pageRows = context.pageRows;
    $: rowCount = context.rowsPerPage;

    const getSectionColor = (section: string | null) => {
        if (!section || $backgroundMode !== 'custom') return null;
        const color = $sectionColors[section];
        if (!color) return null;
        return applyOpacityToHex(color, $sectionColorOpacity / 100);
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
    style={`--nx9-rows-per-page: ${rowCount}; --nx9-font-size: var(--mandala-font-7x9, var(--mandala-font-3x3));`}
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
                        <MandalaCard
                            {nodeId}
                            {section}
                            active={nodeId === $activeNodeId}
                            preserveActiveBackground={$whiteThemeMode}
                            sectionIndicatorVariant={!$whiteThemeMode
                                ? 'section-capsule'
                                : 'plain-with-pin'}
                            editing={$editingState.activeNodeId === nodeId &&
                                !$editingState.isInSidebar &&
                                !$showDetailSidebar}
                            selected={$selectedNodes.has(nodeId)}
                            pinned={$pinnedNodes.has(nodeId)}
                            sectionColor={getSectionColor(section)}
                            draggable={false}
                            gridCell={{
                                mode: 'nx9',
                                row,
                                col,
                                page: context.currentPage,
                            }}
                        />
                    {:else}
                        <div class="nx9-cell__empty">{section}</div>
                    {/if}
                </div>
            {/each}
        {:else if rowModel.kind === 'ghost-next-core-row'}
            <div
                class="nx9-cell mandala-cell nx9-cell--ghost-create"
                class:is-top-edge={row === 0}
                class:is-bottom-edge={row === rowCount - 1}
                class:is-left-edge={true}
                class:is-active-cell={isActiveCell(row, 0)}
                style={`grid-row: ${row + 1}; grid-column: 1;`}
                on:click={() => selectGhostCreateCell(row)}
            >
                <Nx9NextCoreCell nextCoreSection={rowModel.nextCoreSection} />
            </div>
            <div
                class="nx9-cell mandala-cell nx9-cell--ghost-band"
                class:is-top-edge={row === 0}
                class:is-bottom-edge={row === rowCount - 1}
                class:is-right-edge={true}
                style={`grid-row: ${row + 1}; grid-column: 2 / 10;`}
            />
        {:else}
            {#each Array.from({ length: 9 }, (_, index) => index) as col (col)}
                <div
                    class="nx9-cell mandala-cell nx9-cell--padding"
                    class:is-top-edge={row === 0}
                    class:is-bottom-edge={row === rowCount - 1}
                    class:is-left-edge={col === 0}
                    class:is-right-edge={col === 8}
                    style={`grid-row: ${row + 1}; grid-column: ${col + 1};`}
                />
            {/each}
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
    .nx9-cell--ghost-create {
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
    .nx9-cell--padding,
    .nx9-cell--ghost-band,
    .nx9-cell--ghost-create {
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        background: color-mix(
            in srgb,
            var(--background-primary) 80%,
            var(--background-modifier-border) 20%
        );
    }

    .nx9-cell--ghost-create,
    .nx9-cell--ghost-band {
        background: color-mix(
            in srgb,
            var(--background-primary) 92%,
            var(--background-modifier-border) 8%
        );
    }

    .nx9-cell--ghost-create {
        align-items: center;
        justify-content: center;
    }

    .nx9-cell--ghost-band {
        border-style: solid;
        border-color: color-mix(
            in srgb,
            var(--background-modifier-border) 65%,
            transparent
        );
        overflow: hidden;
    }

    .nx9-cell--ghost-band::after {
        content: '';
        position: absolute;
        inset: 16%;
        border-radius: 999px;
        background: color-mix(
            in srgb,
            var(--background-modifier-border) 34%,
            transparent
        );
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
