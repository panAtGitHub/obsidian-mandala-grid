<script lang="ts">
    import MandalaCard from 'src/mandala-cell/view/components/mandala-card.svelte';
    import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
    import {
        resolveCardGridStyle,
        type ResolvedGridStyle,
    } from 'src/mandala-scenes/shared/grid-style';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import type { Nx9WeekCellViewModel } from 'src/mandala-scenes/view-nx9-week-7x9/assemble-cell-view-model';
    import { setActiveCellNx9Week7x9 } from 'src/mandala-scenes/view-nx9-week-7x9/set-active-cell';

    const view = getView();

    export let cells: Nx9WeekCellViewModel[] = [];
    export let gridStyle: ResolvedGridStyle = resolveCardGridStyle({
        whiteThemeMode: false,
    });
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
    class="nx9-grid mandala-grid mandala-grid--nx9-week mandala-card-grid"
    class:is-compact={gridStyle.compactMode}
    style="--nx9-rows-per-page: 7; --nx9-font-size: var(--mandala-font-7x9, var(--mandala-font-3x3));"
>
    {#each cells as cell (cell.key)}
        <div
            class="nx9-cell mandala-cell mandala-card-grid__cell"
            class:mandala-card-grid__cell--card={!!cell.cardViewModel}
            class:mandala-card-grid__cell--empty={!cell.isPlaceholder &&
                !cell.nodeId}
            class:mandala-card-grid__cell--placeholder={cell.isPlaceholder}
            class:nx9-cell--desktop-card={!!cell.cardViewModel}
            class:is-clickable={!!cell.section && !cell.isPlaceholder}
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
                <div class="mandala-card-grid__empty">
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
        align-items: stretch;
        justify-items: stretch;
    }

    .nx9-cell--desktop-card {
        --mandala-card-font-size: var(--nx9-font-size);
    }

    .nx9-cell.is-clickable {
        cursor: default;
    }
</style>
