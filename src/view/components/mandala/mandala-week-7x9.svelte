<script lang="ts">
    import { Platform } from 'obsidian';
    import { derived } from 'src/lib/store/derived';
    import {
        mapWeekPlanRows,
        parseDayPlanFrontmatter,
        sectionAtCellWeek7x9,
    } from 'src/lib/mandala/day-plan';
    import { getView } from 'src/view/components/container/context';
    import {
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        ShowMandalaDetailSidebarStore,
        WeekStartStore,
        WhiteThemeModeStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { setActiveCellWeek7x9 } from 'src/view/helpers/mandala/set-active-cell-week-7x9';
    import {
        openSidebarAndEditMandalaNode,
        setActiveMandalaNode,
    } from 'src/view/helpers/mandala/node-editing';
    import MandalaCard from 'src/view/components/mandala/mandala-card.svelte';
    import { SectionColorBySectionStore } from 'src/stores/document/derived/section-colors-store';
    import { applyOpacityToHex } from 'src/view/helpers/mandala/section-colors';

    const view = getView();
    const weekStart = WeekStartStore(view);
    const sectionColors = SectionColorBySectionStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
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
    const anchorDate = derived(
        view.viewStore,
        (state) => state.ui.mandala.weekAnchorDate,
    );

    type CellSummary = { title: string; body: string };
    const summaryCache = new Map<string, CellSummary>();

    const normalizeCellPreviewText = (raw: string) =>
        raw
            .replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, '')
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/^\s*\d+\.\s+/gm, '')
            .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
            .replace(/\[\[([^\]]+)\]\]/g, '$1')
            .replace(/\s+/g, ' ')
            .trim();

    const HEADING_RE = /^\s{0,3}#{1,6}\s+/;
    const buildSummary = (nodeId: string, content: string): CellSummary => {
        const cacheKey = `${nodeId}::${content}`;
        const cached = summaryCache.get(cacheKey);
        if (cached) return cached;

        const lines = content.split('\n');
        const firstLine = lines[0]?.trim() ?? '';
        let title = '';
        let body = '';

        if (firstLine && HEADING_RE.test(firstLine)) {
            title = normalizeCellPreviewText(firstLine.replace(HEADING_RE, ''));
            body = normalizeCellPreviewText(lines.slice(1).join('\n')).slice(0, 150);
        } else {
            body = normalizeCellPreviewText(lines.join('\n')).slice(0, 150);
        }

        const summary = { title, body };
        summaryCache.set(cacheKey, summary);
        return summary;
    };

    type CellModel = {
        row: number;
        col: number;
        nodeId: string | null;
        title: string;
        body: string;
        isPlaceholder: boolean;
        isCenterColumn: boolean;
    };

    let rows: ReturnType<typeof mapWeekPlanRows> = [];
    let cells: CellModel[] = [];

    $: {
        const plan = parseDayPlanFrontmatter($documentState.file.frontmatter);
        rows =
            plan && $anchorDate
                ? mapWeekPlanRows(plan.year, $anchorDate, $weekStart)
                : [];
    }

    $: {
        const nextCells: CellModel[] = [];
        for (let row = 0; row < 7; row += 1) {
            const rowModel = rows[row] ?? {
                date: '',
                coreSection: null,
                inPlanYear: false,
            };
            for (let col = 0; col < 9; col += 1) {
                const section = sectionAtCellWeek7x9(row, col, rows);
                const nodeId = section
                    ? $documentState.sections.section_id[section] ?? null
                    : null;
                const content = nodeId
                    ? $documentState.document.content[nodeId]?.content ?? ''
                    : '';
                const summary = nodeId
                    ? buildSummary(nodeId, content)
                    : { title: '', body: '' };
                nextCells.push({
                    row,
                    col,
                    nodeId,
                    title: summary.title,
                    body: summary.body,
                    isPlaceholder: !rowModel.inPlanYear,
                    isCenterColumn: col === 0,
                });
            }
        }
        cells = nextCells;
    }

    const onCellClick = (cell: CellModel) => {
        setActiveCellWeek7x9(view, { row: cell.row, col: cell.col });
        if (!Platform.isMobile && cell.nodeId) return;
        if (!cell.nodeId) return;
        setActiveMandalaNode(view, cell.nodeId);
    };

    const renderText = (element: HTMLElement, content: string) => {
        const render = () => {
            element.empty();
            if (!content) return;
            element.setText(content);
        };
        render();
        return {
            update(nextContent: string) {
                content = nextContent;
                render();
            },
        };
    };

    const getSectionColor = (section: string | null) => {
        if (!section || $backgroundMode !== 'custom') return null;
        const color = $sectionColors[section];
        if (!color) return null;
        return applyOpacityToHex(color, $sectionColorOpacity / 100);
    };
</script>

<div class="week-plan-shell">
    <div
        class="week-plan-grid"
        class:mandala-grid={!Platform.isMobile}
        class:mandala-grid--week={!Platform.isMobile}
    >
        {#each cells as cell (`${cell.row}-${cell.col}`)}
            <div
                class="week-plan-cell"
                class:mandala-cell={!Platform.isMobile}
                class:week-plan-cell--desktop-card={!Platform.isMobile}
                class:week-plan-cell--mobile={Platform.isMobile}
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
                on:click={() => onCellClick(cell)}
                on:dblclick={() =>
                    Platform.isMobile && cell.nodeId
                        ? openSidebarAndEditMandalaNode(view, cell.nodeId)
                        : undefined}
            >
                {#if !Platform.isMobile && cell.nodeId}
                    <MandalaCard
                        nodeId={cell.nodeId}
                        section={sectionAtCellWeek7x9(cell.row, cell.col, rows) ?? ''}
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
                        sectionColor={getSectionColor(
                            sectionAtCellWeek7x9(cell.row, cell.col, rows),
                        )}
                        draggable={false}
                        gridCell={{ mode: 'week-7x9', row: cell.row, col: cell.col }}
                    />
                {:else if cell.nodeId}
                    <div class="week-plan-cell__content">
                        {#if cell.title}
                            <div class="week-plan-cell__title" use:renderText={cell.title}>
                            </div>
                        {/if}
                        {#if cell.body}
                            <div class="week-plan-cell__body" use:renderText={cell.body}>
                            </div>
                        {/if}
                    </div>
                {:else if cell.isPlaceholder}
                    <div class="week-plan-cell__empty">超出本年</div>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    .week-plan-shell {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }

    .week-plan-grid {
        flex: 1 1 auto;
        width: 100%;
        height: 100%;
    }

    .week-plan-grid.mandala-grid {
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

    .week-plan-grid:not(.mandala-grid) {
        display: grid;
        grid-template-columns: repeat(9, minmax(0, 1fr));
        grid-template-rows: repeat(7, minmax(0, 1fr));
        gap: 0;
        background: var(--background-secondary);
        font-size: var(--mandala-font-7x9, var(--mandala-font-9x9));
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

    .week-plan-cell--mobile {
        padding: 6px;
        background: var(--background-primary);
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
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

    .week-plan-cell--desktop-card :global(.lng-prev) {
        padding: 2px 2px 3px 4px;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-gutter: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        line-height: 1.12;
        --p-spacing: 0px;
    }

    .week-plan-cell--desktop-card :global(.lng-prev > *) {
        max-height: none !important;
        overflow: visible !important;
    }

    .week-plan-cell--desktop-card :global(.lng-prev::-webkit-scrollbar) {
        display: none;
    }

    .week-plan-cell--desktop-card :global(.lng-prev p) {
        margin-block-start: 0 !important;
        margin-block-end: 0 !important;
        line-height: 1.12;
    }

    .week-plan-cell--desktop-card :global(.lng-prev h1),
    .week-plan-cell--desktop-card :global(.lng-prev h2),
    .week-plan-cell--desktop-card :global(.lng-prev h3),
    .week-plan-cell--desktop-card :global(.lng-prev h4),
    .week-plan-cell--desktop-card :global(.lng-prev h5),
    .week-plan-cell--desktop-card :global(.lng-prev h6) {
        margin-top: 0 !important;
        margin-bottom: 1px !important;
        line-height: 1.08;
    }

    .week-plan-cell--desktop-card :global(.mandala-card-meta) {
        top: 2px;
        right: 3px;
        gap: 2px;
        font-size: 9px;
        opacity: 0.5;
    }

    .week-plan-cell--desktop-card :global(.mandala-card-meta__pin svg) {
        width: 9px;
        height: 9px;
    }

    .week-plan-cell--desktop-card :global(.mandala-idle-scrollbar) {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .week-plan-cell--desktop-card
        :global(.mandala-idle-scrollbar::-webkit-scrollbar) {
        display: none;
    }

    .week-plan-cell--desktop-card :global(.editor-container) {
        overflow: hidden !important;
    }

    .week-plan-cell--desktop-card :global(.cm-editor),
    .week-plan-cell--desktop-card :global(.cm-editor .cm-scroller) {
        height: 100%;
    }

    .week-plan-cell--desktop-card :global(.cm-editor .cm-scroller) {
        overflow-x: hidden !important;
        overflow-y: auto !important;
        scrollbar-gutter: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding: 2px 2px 3px 4px !important;
    }

    .week-plan-cell--desktop-card
        :global(.cm-editor .cm-scroller::-webkit-scrollbar) {
        display: none;
    }

    .week-plan-cell--mobile.is-center-column {
        border-left: 3px solid var(--mandala-border-color);
    }

    .week-plan-cell--mobile:nth-child(-n + 9) {
        border-top: 3px solid var(--mandala-border-color);
    }

    .week-plan-cell--mobile:nth-child(9n) {
        border-right: 3px solid var(--mandala-border-color);
    }

    .week-plan-cell--mobile:nth-last-child(-n + 9) {
        border-bottom: 3px solid var(--mandala-border-color);
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

    .week-plan-cell--mobile.is-placeholder {
        cursor: default;
    }

    .week-plan-cell__content {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-height: 0;
    }

    .week-plan-cell__title {
        font-weight: 600;
        line-height: 1.2;
        color: var(--text-normal);
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
    }

    .week-plan-cell__body {
        color: var(--text-muted);
        line-height: 1.2;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
        white-space: pre-wrap;
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
