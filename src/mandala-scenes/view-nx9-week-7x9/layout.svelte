<script lang="ts">
    import MandalaCard from 'src/mandala-cell/view/components/mandala-card.svelte';
    import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import type { Nx9WeekCellViewModel } from 'src/mandala-scenes/view-nx9-week-7x9/assemble-cell-view-model';
    import { setActiveCellNx9Week7x9 } from 'src/mandala-scenes/view-nx9-week-7x9/set-active-cell';

    const view = getView();

    export let cells: Nx9WeekCellViewModel[] = [];
    export let compactMode = false;
    export let themeSnapshot: MandalaThemeSnapshot = {
        themeTone: 'light',
        themeUnderlayColor: '',
        activeThemeUnderlayColor: '',
    };

    const handleCellClick = (cell: Nx9WeekCellViewModel) => {
        if (!cell.section || cell.isPlaceholder) return;
        setActiveCellNx9Week7x9(view, {
            row: cell.row,
            col: cell.col,
            page: 0,
        });
    };
</script>

<div
    class="nx9-grid mandala-grid mandala-grid--nx9-week"
    class:is-compact={compactMode}
    style="--nx9-rows-per-page: 7; --nx9-font-size: var(--mandala-font-7x9, var(--mandala-font-3x3));"
>
    {#each cells as cell (cell.key)}
        <div
            class="nx9-cell mandala-cell nx9-cell--desktop-card"
            class:is-clickable={!!cell.section && !cell.isPlaceholder}
            class:is-empty-section={!cell.isPlaceholder && !cell.nodeId}
            class:is-placeholder={cell.isPlaceholder}
            class:is-top-edge={cell.isTopEdge}
            class:is-bottom-edge={cell.isBottomEdge}
            class:is-left-edge={cell.isLeftEdge}
            class:is-right-edge={cell.isRightEdge}
            class:is-active-cell={cell.isActiveCell}
            class:is-active-node={cell.isActiveNode}
            style={`grid-row: ${cell.row + 1}; grid-column: ${cell.col + 1};`}
            on:click|capture={() => handleCellClick(cell)}
        >
            {#if cell.cardViewModel}
                <MandalaCard
                    viewModel={cell.cardViewModel}
                    uiState={cell.cardUiState}
                    {themeSnapshot}
                />
            {:else}
                <div class="nx9-cell__empty">
                    {cell.isPlaceholder ? cell.emptyLabel ?? '' : cell.section ?? ''}
                </div>
            {/if}
        </div>
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

    .nx9-grid.is-compact {
        --mandala-gap: max(2px, calc(var(--mandala-gap) * 0.75));
    }

    .nx9-cell {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 0;
        min-width: 0;
        background: transparent;
    }

    .nx9-cell.is-clickable {
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
    .nx9-cell.is-placeholder {
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        background: color-mix(
            in srgb,
            var(--background-primary) 80%,
            var(--background-modifier-border) 20%
        );
    }

    .nx9-cell.is-placeholder {
        background: color-mix(
            in srgb,
            var(--background-primary) 76%,
            var(--background-modifier-border) 24%
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

    :global(.mandala-white-theme) .mandala-grid--nx9-week {
        gap: 0;
        box-sizing: border-box;
    }

    :global(.mandala-white-theme) .mandala-grid--nx9-week > .mandala-cell {
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        box-sizing: border-box;
        overflow: hidden;
        border-radius: 0;
    }

    :global(.mandala-white-theme)
        .mandala-grid--nx9-week
        > .mandala-cell.is-top-edge {
        border-top: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--nx9-week
        > .mandala-cell.is-left-edge {
        border-left: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--nx9-week
        > .mandala-cell.is-right-edge {
        border-right: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--nx9-week
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
