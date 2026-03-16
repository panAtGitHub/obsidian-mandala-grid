<script lang="ts">
    import { derived } from 'src/lib/store/derived';
    import type { WeekPlanRow } from 'src/lib/mandala/day-plan';
    import { getView } from 'src/view/components/container/context';
    import {
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        ShowMandalaDetailSidebarStore,
        WeekPlanCompactModeStore,
        WhiteThemeModeStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { setActiveCellWeek7x9 } from 'src/view/helpers/mandala/set-active-cell-week-7x9';
    import MandalaCard from 'src/view/components/mandala/mandala-card.svelte';
    import { SectionColorBySectionStore } from 'src/stores/document/derived/section-colors-store';
    import { applyOpacityToHex } from 'src/view/helpers/mandala/section-colors';
    import {
        buildWeekPlanBaseCells,
        type WeekPlanBaseCell,
    } from 'src/view/helpers/mandala/week-plan-context';

    export let rows: WeekPlanRow[] = [];

    const view = getView();
    const sectionColors = SectionColorBySectionStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const weekPlanCompactMode = WeekPlanCompactModeStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);

    const documentState = derived(view.documentStore, (state) => state);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const activeCell = derived(
        view.viewStore,
        (state) => state.ui.mandala.activeCellWeek7x9,
    );
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

    let cells: WeekPlanBaseCell[] = [];

    $: cells = buildWeekPlanBaseCells({
        rows,
        sectionIdMap: $documentState.sections.section_id,
    });

    const getSectionColor = (section: string | null) => {
        if (!section || $backgroundMode !== 'custom') return null;
        const color = $sectionColors[section];
        if (!color) return null;
        return applyOpacityToHex(color, $sectionColorOpacity / 100);
    };
</script>

<div
    class="week-plan-grid mandala-grid mandala-grid--week"
    class:week-plan-grid--compact={$weekPlanCompactMode}
>
    {#each cells as cell (`${cell.row}-${cell.col}`)}
        <div
            class="week-plan-cell mandala-cell week-plan-cell--desktop-card"
            class:is-placeholder={cell.isPlaceholder}
            class:is-center-column={cell.isCenterColumn}
            class:is-active-cell={$activeCell &&
                $activeCell.row === cell.row &&
                $activeCell.col === cell.col}
            class:is-active-node={!$activeCell &&
                !!cell.nodeId &&
                cell.nodeId === $activeNodeId}
            on:click|capture={() =>
                setActiveCellWeek7x9(view, {
                    row: cell.row,
                    col: cell.col,
                })}
        >
            {#if cell.nodeId}
                <MandalaCard
                    nodeId={cell.nodeId}
                    section={cell.section ?? ''}
                    active={cell.nodeId === $activeNodeId}
                    preserveActiveBackground={$whiteThemeMode}
                    sectionIndicatorVariant={!$whiteThemeMode
                        ? 'section-capsule'
                        : 'plain-with-pin'}
                    editing={$editingState.activeNodeId === cell.nodeId &&
                        !$editingState.isInSidebar &&
                        !$showDetailSidebar}
                    selected={$selectedNodes.has(cell.nodeId)}
                    pinned={$pinnedNodes.has(cell.nodeId)}
                    sectionColor={getSectionColor(cell.section)}
                    draggable={false}
                    gridCell={null}
                />
            {:else if cell.isPlaceholder}
                <div class="week-plan-cell__empty">超出本年</div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .week-plan-grid {
        flex: 1 1 auto;
        width: 100%;
        height: 100%;
        display: grid;
        gap: var(--mandala-gap);
        align-items: start;
    }

    .mandala-grid--week {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(9, minmax(0, 1fr));
        grid-template-rows: repeat(7, minmax(0, 1fr));
        align-items: stretch;
        justify-items: stretch;
    }

    .week-plan-grid--compact {
        --week-compact-preview-padding: 2px 2px 3px 4px;
        --week-compact-line-height: 1.12;
        --week-compact-heading-line-height: 1.08;
        --week-compact-heading-margin-bottom: 1px;
        --week-compact-meta-font-size: 9px;
        --week-compact-meta-gap: 2px;
        --week-compact-meta-top: 2px;
        --week-compact-meta-right: 3px;
    }

    .week-plan-cell {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 0;
        cursor: pointer;
    }

    .week-plan-cell.mandala-cell {
        width: 100%;
        height: 100%;
    }

    .week-plan-cell--desktop-card {
        padding: 0;
        background: transparent;
        --min-node-height: 0;
        --mandala-card-min-height: 0;
        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-font-size: var(
            --mandala-font-7x9,
            var(--mandala-font-3x3)
        );
    }

    .week-plan-cell--desktop-card :global(.mandala-card) {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .week-plan-cell--desktop-card :global(.lng-prev),
    .week-plan-cell--desktop-card :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
    }

    .week-plan-cell--desktop-card :global(.lng-prev) {
        overflow: auto;
    }

    .week-plan-cell--desktop-card :global(.editor-container) {
        overflow: auto;
    }

    .week-plan-cell--desktop-card :global(.cm-editor),
    .week-plan-cell--desktop-card :global(.cm-editor .cm-scroller) {
        height: 100%;
    }

    .week-plan-cell--desktop-card :global(.cm-editor .cm-scroller) {
        overflow: auto !important;
    }

    .week-plan-grid--compact .week-plan-cell--desktop-card :global(.lng-prev) {
        padding: var(--week-compact-preview-padding);
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-gutter: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        line-height: var(--week-compact-line-height);
        --p-spacing: 0px;
    }

    .week-plan-grid--compact
        .week-plan-cell--desktop-card
        :global(.lng-prev > *) {
        max-height: none !important;
        overflow: visible !important;
    }

    .week-plan-grid--compact
        .week-plan-cell--desktop-card
        :global(.lng-prev::-webkit-scrollbar) {
        display: none;
    }

    .week-plan-grid--compact .week-plan-cell--desktop-card :global(.lng-prev p) {
        margin-block-start: 0 !important;
        margin-block-end: 0 !important;
        line-height: var(--week-compact-line-height);
    }

    .week-plan-grid--compact .week-plan-cell--desktop-card :global(.lng-prev h1),
    .week-plan-grid--compact .week-plan-cell--desktop-card :global(.lng-prev h2),
    .week-plan-grid--compact .week-plan-cell--desktop-card :global(.lng-prev h3),
    .week-plan-grid--compact .week-plan-cell--desktop-card :global(.lng-prev h4),
    .week-plan-grid--compact .week-plan-cell--desktop-card :global(.lng-prev h5),
    .week-plan-grid--compact .week-plan-cell--desktop-card :global(.lng-prev h6) {
        margin-top: 0 !important;
        margin-bottom: var(--week-compact-heading-margin-bottom) !important;
        line-height: var(--week-compact-heading-line-height);
    }

    .week-plan-grid--compact
        .week-plan-cell--desktop-card
        :global(.mandala-card-meta) {
        top: var(--week-compact-meta-top);
        right: var(--week-compact-meta-right);
        gap: var(--week-compact-meta-gap);
        font-size: var(--week-compact-meta-font-size);
        opacity: 0.5;
    }

    .week-plan-grid--compact
        .week-plan-cell--desktop-card
        :global(.mandala-card-meta__pin svg) {
        width: 9px;
        height: 9px;
    }

    .week-plan-grid--compact
        .week-plan-cell--desktop-card
        :global(.mandala-idle-scrollbar) {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .week-plan-grid--compact
        .week-plan-cell--desktop-card
        :global(.mandala-idle-scrollbar::-webkit-scrollbar) {
        display: none;
    }

    .week-plan-grid--compact
        .week-plan-cell--desktop-card
        :global(.editor-container) {
        overflow: hidden !important;
    }

    .week-plan-grid--compact
        .week-plan-cell--desktop-card
        :global(.cm-editor .cm-scroller) {
        overflow-x: hidden !important;
        overflow-y: auto !important;
        scrollbar-gutter: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding: var(--week-compact-preview-padding) !important;
    }

    .week-plan-grid--compact
        .week-plan-cell--desktop-card
        :global(.cm-editor .cm-scroller::-webkit-scrollbar) {
        display: none;
    }

    .week-plan-cell.is-active-cell,
    .week-plan-cell.is-active-node {
        outline: var(--mandala-grid-highlight-width, 2px) solid
            var(--mandala-grid-highlight-color, var(--mandala-color-selection));
        outline-offset: -2px;
        z-index: 1;
    }

    .week-plan-cell--desktop-card.is-active-cell,
    .week-plan-cell--desktop-card.is-active-node {
        outline: none;
    }

    .week-plan-cell.is-placeholder {
        background: color-mix(
            in srgb,
            var(--background-modifier-border) 25%,
            var(--background-primary)
        );
    }

    .week-plan-cell--desktop-card.is-placeholder {
        background: transparent;
    }

    .week-plan-cell__empty {
        margin-top: auto;
        color: var(--text-faint);
        font-size: 10px;
    }

    :global(.mandala-white-theme) .mandala-grid--week {
        gap: 0;
        box-sizing: border-box;
    }

    :global(.mandala-white-theme) .mandala-grid--week > .mandala-cell {
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        box-sizing: border-box;
        overflow: hidden;
    }

    :global(.mandala-white-theme)
        .mandala-grid--week
        > .mandala-cell:nth-child(-n + 9) {
        border-top: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--week
        > .mandala-cell:nth-child(9n + 1) {
        border-left: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--week
        > .mandala-cell:nth-last-child(-n + 9) {
        border-bottom: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--week
        > .mandala-cell:nth-child(9n) {
        border-right: 3px solid var(--mandala-border-color);
    }
</style>
