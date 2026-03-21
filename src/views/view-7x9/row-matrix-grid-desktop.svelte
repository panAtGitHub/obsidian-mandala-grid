<script lang="ts">
    import { derived } from 'src/lib/store/derived';
    import { getView } from 'src/views/shared/shell/context';
    import {
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        ShowMandalaDetailSidebarStore,
        WhiteThemeModeStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import MandalaCard from 'src/cell/display/components/mandala-card.svelte';
    import { SectionColorBySectionStore } from 'src/stores/cell/section-colors-store';
    import { PinnedSectionsStore } from 'src/stores/cell/document-derived-stores';
    import { resolveCustomSectionColor } from 'src/view/helpers/mandala/section-colors';
    import { setActiveCellWeek7x9 } from 'src/view/helpers/mandala/set-active-cell-week-7x9';
    import type { WeekPlanBaseCell } from 'src/view/helpers/mandala/week-plan-context';

    export let cells: WeekPlanBaseCell[] = [];
    export let compactMode = false;
    export let fontVariable = '--mandala-font-7x9';

    const view = getView();
    const sectionColors = SectionColorBySectionStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);

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

    $: activeCell = $mandalaUiState.activeCellWeek7x9;

    const handleCellClick = (cell: WeekPlanBaseCell) => {
        if (!cell.nodeId) return;
        setActiveCellWeek7x9(view, { row: cell.row, col: cell.col });
    };

    const getSectionColor = (section: string | null) => {
        return resolveCustomSectionColor({
            section,
            backgroundMode: $backgroundMode,
            sectionColorsBySection: $sectionColors,
            sectionColorOpacity: $sectionColorOpacity,
        });
    };
</script>

<div
    class="row-matrix-grid mandala-grid mandala-grid--row-matrix"
    class:row-matrix-grid--compact={compactMode}
    style={`--row-matrix-font-size: var(${fontVariable}, var(--mandala-font-3x3));`}
>
    {#each cells as cell (`${cell.row}-${cell.col}`)}
        <div
            class="row-matrix-cell mandala-cell row-matrix-cell--desktop-card"
            class:is-placeholder={cell.isPlaceholder}
            class:is-empty-section={!cell.isPlaceholder &&
                !cell.nodeId &&
                !!cell.emptyLabel}
            class:is-clickable={!!cell.nodeId}
            class:is-center-column={cell.isCenterColumn}
            class:is-active-cell={activeCell &&
                activeCell.row === cell.row &&
                activeCell.col === cell.col}
            class:is-active-node={!activeCell &&
                !!cell.nodeId &&
                cell.nodeId === $activeNodeId}
            on:click|capture={() => handleCellClick(cell)}
        >
            {#if cell.nodeId}
                <MandalaCard
                    nodeId={cell.nodeId}
                    section={cell.section ?? ''}
                    active={cell.nodeId === $activeNodeId}
                    preserveActiveBackground={activeCell
                        ? $whiteThemeMode
                        : true}
                    sectionIndicatorVariant={!$whiteThemeMode
                        ? 'section-capsule'
                        : 'plain-with-pin'}
                    editing={$editingState.activeNodeId === cell.nodeId &&
                        !$editingState.isInSidebar &&
                        !$showDetailSidebar}
                    selected={$selectedNodes.has(cell.nodeId)}
                    pinned={cell.section
                        ? $pinnedSections.has(cell.section)
                        : false}
                    sectionColor={getSectionColor(cell.section)}
                    gridCell={{
                        mode: 'week-7x9',
                        row: cell.row,
                        col: cell.col,
                    }}
                />
            {:else if cell.isPlaceholder || cell.emptyLabel}
                <div class="row-matrix-cell__empty">
                    {cell.emptyLabel ?? ''}
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .row-matrix-grid {
        flex: 1 1 auto;
        width: 100%;
        height: 100%;
        display: grid;
        gap: var(--mandala-gap);
        align-items: start;
    }

    .mandala-grid--row-matrix {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(9, minmax(0, 1fr));
        grid-auto-rows: minmax(0, 1fr);
        align-items: stretch;
        justify-items: stretch;
    }

    .row-matrix-grid--compact {
        --week-compact-preview-padding: 2px 2px 3px 4px;
        --week-compact-line-height: 1.12;
        --week-compact-heading-line-height: 1.08;
        --week-compact-heading-margin-bottom: 1px;
        --week-compact-meta-font-size: 9px;
        --week-compact-meta-gap: 2px;
        --week-compact-meta-top: 2px;
        --week-compact-meta-right: 3px;
    }

    .row-matrix-cell {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 0;
        min-width: 0;
        cursor: default;
    }

    .row-matrix-cell.is-clickable {
        cursor: pointer;
    }

    .row-matrix-cell.mandala-cell {
        width: 100%;
        height: 100%;
    }

    .row-matrix-cell--desktop-card {
        padding: 0;
        background: transparent;
        --min-node-height: 0;
        --mandala-card-min-height: 0;
        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-font-size: var(--row-matrix-font-size);
    }

    .row-matrix-cell--desktop-card :global(.mandala-card) {
        width: 100%;
        height: 100%;
        min-height: 0;
        min-width: 0;
    }

    .row-matrix-cell--desktop-card :global(.lng-prev),
    .row-matrix-cell--desktop-card :global(.editor-container),
    .row-matrix-cell--desktop-card :global(.mandala-inline-editor),
    .row-matrix-cell--desktop-card :global(.markdown-source-view),
    .row-matrix-cell--desktop-card :global(.view-content) {
        flex: 1 1 auto;
        width: 100%;
        min-height: 0;
        min-width: 0;
        height: 100%;
    }

    .row-matrix-cell--desktop-card :global(.lng-prev) {
        overflow: auto;
    }

    .row-matrix-cell--desktop-card :global(.editor-container),
    .row-matrix-cell--desktop-card :global(.mandala-inline-editor),
    .row-matrix-cell--desktop-card :global(.markdown-source-view),
    .row-matrix-cell--desktop-card :global(.view-content) {
        display: flex;
        flex-direction: column;
    }

    .row-matrix-cell--desktop-card :global(.editor-container) {
        overflow: hidden;
    }

    .row-matrix-cell--desktop-card :global(.cm-editor),
    .row-matrix-cell--desktop-card :global(.cm-editor .cm-scroller) {
        width: 100%;
        height: 100%;
        min-width: 0;
    }

    .row-matrix-cell--desktop-card :global(.cm-editor .cm-scroller) {
        overflow: auto !important;
    }

    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.lng-prev) {
        padding: var(--week-compact-preview-padding);
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-gutter: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        line-height: var(--week-compact-line-height);
        --p-spacing: 0px;
    }

    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.lng-prev > *) {
        max-height: none !important;
        overflow: visible !important;
    }

    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.lng-prev::-webkit-scrollbar) {
        display: none;
    }

    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.lng-prev p) {
        margin-block-start: 0 !important;
        margin-block-end: 0 !important;
        line-height: var(--week-compact-line-height);
    }

    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.lng-prev h1),
    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.lng-prev h2),
    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.lng-prev h3),
    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.lng-prev h4),
    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.lng-prev h5),
    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.lng-prev h6) {
        margin-top: 0 !important;
        margin-bottom: var(--week-compact-heading-margin-bottom) !important;
        line-height: var(--week-compact-heading-line-height);
    }

    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.mandala-card-meta) {
        top: var(--week-compact-meta-top);
        right: var(--week-compact-meta-right);
        gap: var(--week-compact-meta-gap);
        font-size: var(--week-compact-meta-font-size);
        opacity: 0.5;
    }

    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.mandala-card-meta__pin svg) {
        width: 9px;
        height: 9px;
    }

    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.mandala-idle-scrollbar) {
        scrollbar-width: none;
    }

    .row-matrix-grid--compact
        .row-matrix-cell--desktop-card
        :global(.mandala-idle-scrollbar::-webkit-scrollbar) {
        display: none;
    }

    .row-matrix-cell.is-active-cell,
    .row-matrix-cell.is-active-node {
        outline: var(--mandala-grid-highlight-width, 2px) solid
            var(--mandala-grid-highlight-color, var(--mandala-color-selection));
        outline-offset: 0;
    }

    .row-matrix-cell--desktop-card.is-active-cell,
    .row-matrix-cell--desktop-card.is-active-node {
        outline: none;
    }

    .row-matrix-cell.is-placeholder,
    .row-matrix-cell.is-empty-section {
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        background: color-mix(
            in srgb,
            var(--background-primary) 80%,
            var(--background-modifier-border) 20%
        );
    }

    .row-matrix-cell__empty {
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

    :global(.mandala-white-theme) .mandala-grid--row-matrix {
        gap: 0;
        box-sizing: border-box;
    }

    :global(.mandala-white-theme) .mandala-grid--row-matrix > .mandala-cell {
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        box-sizing: border-box;
        overflow: hidden;
        border-radius: 0;
    }

    :global(.mandala-white-theme)
        .mandala-grid--row-matrix
        > .mandala-cell:nth-child(-n + 9) {
        border-top: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--row-matrix
        > .mandala-cell:nth-child(9n + 1) {
        border-left: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--row-matrix
        > .mandala-cell:nth-child(9n) {
        border-right: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--row-matrix
        > .mandala-cell:nth-last-child(-n + 9) {
        border-bottom: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme) .row-matrix-cell :global(.mandala-card) {
        border: 0 !important;
        border-left-width: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
    }
</style>
