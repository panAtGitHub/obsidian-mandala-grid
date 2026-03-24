<script lang="ts">
    import { Platform } from 'obsidian';
    import type {
        SimpleSummaryActiveCell,
        SimpleSummaryCellModel,
    } from 'src/mandala-cell/model/simple-summary-cell-model';
    import SimpleSummaryCell from 'src/mandala-cell/view/components/simple-summary-cell.svelte';
    import MandalaNavIcon from 'src/mandala-scenes/shared/mandala-nav-icon.svelte';
    import { onMount } from 'svelte';
    import { derived, derivedEq } from 'src/shared/store/derived';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { jumpCoreTheme } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/jump-core-theme';
    import {
        MandalaBorderOpacityStore,
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        Show9x9ParallelNavButtonsStore,
        Show9x9TitleOnlyStore,
    } from 'src/mandala-settings/state/derived/view-settings-store';
    import { SectionColorBySectionStore } from 'src/mandala-display/stores/section-colors-store';
    import type { ThemeTone } from 'src/mandala-interaction/helpers/contrast-text-tone';
    import { setActiveCell9x9 } from 'src/mandala-interaction/helpers/set-active-cell-9x9';
    import {
        buildMandalaTopologyIndex,
        type MandalaTopologyIndex,
    } from 'src/mandala-display/logic/mandala-topology';
    import {
        build9x9CellViewModels,
        decorate9x9CellViewModels,
        resolve9x9BaseTheme,
        toActiveSummaryCell,
    } from 'src/mandala-scenes/view-9x9/assemble-cell-view-model';
    import { getMandalaActiveCell9x9 } from 'src/mandala-scenes/shared/scene-runtime';

    const view = getView();
    const showTitleOnly = Show9x9TitleOnlyStore(view);
    const show9x9ParallelNavButtons = Show9x9ParallelNavButtonsStore(view);
    const sectionColors = SectionColorBySectionStore(view);
    const borderOpacity = MandalaBorderOpacityStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const activeCellStore = derived(
        view.viewStore,
        (state) => getMandalaActiveCell9x9(state),
    );
    const idToSection = derivedEq(
        view.documentStore,
        (state) => ({
            revision: state.meta.mandalaV2.revision,
            idToSection: state.sections.id_section,
        }),
        (a, b) => a.revision === b.revision,
    );
    const topologySnapshot = derivedEq(
        view.documentStore,
        (state) => ({
            revision: state.meta.mandalaV2.revision,
            topology: buildMandalaTopologyIndex(state.sections.section_id),
        }),
        (a, b) => a.revision === b.revision,
    );
    const gridDocument = derivedEq(
        view.documentStore,
        (state) => ({
            revision: state.meta.mandalaV2.revision,
            contentRevision: state.meta.mandalaV2.contentRevision,
            contentByNodeId: state.document.content,
        }),
        (a, b) =>
            a.revision === b.revision &&
            a.contentRevision === b.contentRevision,
    );
    const layoutSnapshot = derivedEq(
        view.plugin.settings,
        (settings) => {
            const customLayouts = settings.view.mandalaGridCustomLayouts ?? [];
            return {
                selectedLayoutId: view.getCurrentMandalaLayoutId(settings),
                customLayouts,
                customLayoutsKey: JSON.stringify(customLayouts),
            };
        },
        (a, b) =>
            a.selectedLayoutId === b.selectedLayoutId &&
            a.customLayoutsKey === b.customLayoutsKey,
    );
    const swapState = derived(view.viewStore, (state) => state.ui.mandala.swap);
    const hasOpenOverlayModal = derived(view.viewStore, (state) => {
        const controls = state.ui.controls;
        return controls.showHelpSidebar || controls.showSettingsSidebar;
    });

    let gridEl: HTMLDivElement | null = null;
    let bodyLineClamp = 3;
    let currentCoreNumber = 1;
    let baseCells: SimpleSummaryCellModel[] = [];
    let cells: SimpleSummaryCellModel[] = [];
    let currentActiveCell: SimpleSummaryActiveCell = null;
    let themeTone: ThemeTone = 'light';
    let themeUnderlayColor = '';
    let bodyThemeObserver: MutationObserver | null = null;

    let cachedBaseCellsKey = '';
    let cachedBaseCells: SimpleSummaryCellModel[] = [];
    let cachedDecoratedCells: {
        cells: SimpleSummaryCellModel[];
        backgroundMode: string;
        sectionColors: Record<string, string>;
        sectionColorOpacity: number;
        themeTone: ThemeTone;
        themeUnderlayColor: string;
        value: SimpleSummaryCellModel[];
    } | null = null;

    $: {
        const section = $idToSection.idToSection[$activeNodeId];
        const nextCore = Number(resolve9x9BaseTheme(section));
        currentCoreNumber = Number.isFinite(nextCore) ? nextCore : 1;
    }

    const syncThemeSnapshot = () => {
        themeTone = document.body.classList.contains('theme-dark')
            ? 'dark'
            : 'light';
        themeUnderlayColor = window
            .getComputedStyle(document.body)
            .getPropertyValue('--background-primary')
            .trim();
    };

    const resolveBaseCells = ({
        topology,
        contentByNodeId,
        revision,
        contentRevision,
        selectedLayoutId,
        customLayouts,
        customLayoutsKey,
        baseTheme,
    }: {
        topology: MandalaTopologyIndex;
        contentByNodeId: Record<string, { content?: string }>;
        revision: number;
        contentRevision: number;
        selectedLayoutId: string;
        customLayouts: ReturnType<
            typeof view.plugin.settings.getValue
        >['view']['mandalaGridCustomLayouts'];
        customLayoutsKey: string;
        baseTheme: string;
    }) => {
        const key = [
            revision,
            contentRevision,
            selectedLayoutId,
            customLayoutsKey,
            baseTheme,
        ].join('|');
        if (key === cachedBaseCellsKey) return cachedBaseCells;

        const startedAt = performance.now();
        cachedBaseCells = build9x9CellViewModels({
            topology,
            contentByNodeId,
            selectedLayoutId,
            customLayouts,
            baseTheme,
        });
        cachedBaseCellsKey = key;
        view.recordPerfEvent('trace.9x9.build-cells', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            cell_count: cachedBaseCells.length,
            base_theme: baseTheme,
        });
        return cachedBaseCells;
    };

    const resolveDecoratedCells = ({
        sourceCells,
        backgroundMode,
        sectionColors,
        sectionColorOpacity,
        themeTone,
        themeUnderlayColor,
    }: {
        sourceCells: SimpleSummaryCellModel[];
        backgroundMode: string;
        sectionColors: Record<string, string>;
        sectionColorOpacity: number;
        themeTone: ThemeTone;
        themeUnderlayColor: string;
    }) => {
        if (
            cachedDecoratedCells &&
            cachedDecoratedCells.cells === sourceCells &&
            cachedDecoratedCells.backgroundMode === backgroundMode &&
            cachedDecoratedCells.sectionColors === sectionColors &&
            cachedDecoratedCells.sectionColorOpacity === sectionColorOpacity &&
            cachedDecoratedCells.themeTone === themeTone &&
            cachedDecoratedCells.themeUnderlayColor === themeUnderlayColor
        ) {
            return cachedDecoratedCells.value;
        }

        const startedAt = performance.now();
        const value = decorate9x9CellViewModels({
            cells: sourceCells,
            backgroundMode,
            sectionColors,
            sectionColorOpacity,
            themeTone,
            themeUnderlayColor,
        });
        cachedDecoratedCells = {
            cells: sourceCells,
            backgroundMode,
            sectionColors,
            sectionColorOpacity,
            themeTone,
            themeUnderlayColor,
            value,
        };
        view.recordPerfEvent('trace.9x9.decorate-cells', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            cell_count: value.length,
        });
        return value;
    };

    $: {
        const section = $idToSection.idToSection[$activeNodeId];
        const baseTheme = resolve9x9BaseTheme(section);
        baseCells = resolveBaseCells({
            topology: $topologySnapshot.topology,
            contentByNodeId: $gridDocument.contentByNodeId,
            revision: $gridDocument.revision,
            contentRevision: $gridDocument.contentRevision,
            selectedLayoutId: $layoutSnapshot.selectedLayoutId,
            customLayouts: $layoutSnapshot.customLayouts,
            customLayoutsKey: $layoutSnapshot.customLayoutsKey,
            baseTheme,
        });
    }

    $: {
        cells = resolveDecoratedCells({
            sourceCells: baseCells,
            backgroundMode: $backgroundMode,
            sectionColors: $sectionColors,
            sectionColorOpacity: $sectionColorOpacity,
            themeTone,
            themeUnderlayColor,
        });
    }

    $: currentActiveCell = toActiveSummaryCell($activeCellStore);

    const updateBodyClamp = () => {
        if (!gridEl) return;
        const cell = gridEl.querySelector('.simple-cell') as HTMLElement | null;
        const body = gridEl.querySelector('.cell-body') as HTMLElement | null;
        const title = gridEl.querySelector('.cell-title') as HTMLElement | null;
        if (!cell || !body) return;

        const cellBox = cell.getBoundingClientRect();
        const cellStyles = getComputedStyle(cell);
        const padding =
            parseFloat(cellStyles.paddingTop) +
            parseFloat(cellStyles.paddingBottom);
        const bodyLineHeight = parseFloat(getComputedStyle(body).lineHeight);
        const titleLineHeight = title
            ? parseFloat(getComputedStyle(title).lineHeight)
            : bodyLineHeight;
        const reservedTitleHeight = titleLineHeight * 2;
        const reservedGap = 2;
        const available =
            cellBox.height - padding - reservedTitleHeight - reservedGap;
        const lines = Math.max(1, Math.floor(available / bodyLineHeight));
        bodyLineClamp = Math.min(lines, 12);
    };

    onMount(() => {
        syncThemeSnapshot();
        updateBodyClamp();
        bodyThemeObserver = new MutationObserver(() => syncThemeSnapshot());
        bodyThemeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });
        const observer = gridEl
            ? new ResizeObserver(() => updateBodyClamp())
            : null;
        if (observer && gridEl) {
            observer.observe(gridEl);
        }
        return () => {
            observer?.disconnect();
            bodyThemeObserver?.disconnect();
            bodyThemeObserver = null;
        };
    });

    const jumpToPrevCore = (event: MouseEvent) => {
        event.stopPropagation();
        jumpCoreTheme(view, 'up');
    };

    const jumpToNextCore = (event: MouseEvent) => {
        event.stopPropagation();
        jumpCoreTheme(view, 'down');
    };

    const activateSummaryCell = (cell: SimpleSummaryCellModel) => {
        setActiveCell9x9(view, {
            row: cell.row,
            col: cell.col,
        });
    };
</script>

<div class="simple-9x9-shell">
    <div
        class="simple-9x9-grid"
        style={`--mandala-border-opacity: ${$borderOpacity}%; --mandala-body-lines: ${bodyLineClamp};`}
        bind:this={gridEl}
    >
        {#each cells as cell (`${cell.row}-${cell.col}`)}
            <SimpleSummaryCell
                {cell}
                activeNodeId={$activeNodeId}
                activeCell={currentActiveCell}
                showTitleOnly={$showTitleOnly}
                swapState={$swapState}
                activateCell={activateSummaryCell}
                allowDoubleClickEdit={!Platform.isMobile}
            />
        {/each}
    </div>

    {#if !Platform.isMobile && $show9x9ParallelNavButtons && !$hasOpenOverlayModal}
        {#if currentCoreNumber > 1}
            <button
                class="parallel-nav-button parallel-nav-button--left"
                type="button"
                aria-label="切换到上一个平行九宫格"
                on:click={jumpToPrevCore}
            >
                <span class="parallel-nav-button__icon">
                    <MandalaNavIcon
                        direction="left"
                        size={16}
                        strokeWidth={2.3}
                    />
                </span>
            </button>
        {/if}
        <button
            class="parallel-nav-button parallel-nav-button--right"
            type="button"
            aria-label="切换到下一个平行九宫格"
            on:click={jumpToNextCore}
        >
            <span class="parallel-nav-button__icon">
                <MandalaNavIcon direction="right" size={16} strokeWidth={2.3} />
            </span>
        </button>
    {/if}
</div>

<style>
    .simple-9x9-shell {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .simple-9x9-grid {
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        grid-template-rows: repeat(9, 1fr);
        width: 100%;
        height: 100%;
        gap: 0;
        padding: 0;
        box-sizing: border-box;
        background-color: var(--background-secondary);
        font-size: var(--mandala-font-9x9, 11px);
        --mandala-border-opacity: 100%;
        --mandala-gray-block-base: color-mix(
            in srgb,
            var(--background-modifier-border) 70%,
            var(--background-primary)
        );
        --mandala-border-color: color-mix(
            in srgb,
            var(--text-normal) var(--mandala-border-opacity),
            transparent
        );
        --mandala-selection-color: color-mix(
            in srgb,
            var(--mandala-color-selection) var(--mandala-border-opacity),
            transparent
        );
    }

    .parallel-nav-button {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 20;
        width: 30px;
        height: 30px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 999px;
        background: var(--background-primary);
        color: var(--text-normal);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-s);
        cursor: pointer;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            box-shadow 120ms ease,
            transform 120ms ease;
    }

    .parallel-nav-button:hover {
        background: color-mix(
            in srgb,
            var(--background-primary-alt) 75%,
            var(--interactive-accent) 25%
        );
        border-color: color-mix(
            in srgb,
            var(--interactive-accent) 55%,
            var(--background-modifier-border) 45%
        );
        box-shadow:
            0 0 0 1px
                color-mix(in srgb, var(--interactive-accent) 45%, transparent),
            var(--shadow-s);
        transform: translate(-50%, -50%) translateY(-1px);
    }

    .parallel-nav-button:active {
        transform: translate(-50%, -50%) scale(0.96);
    }

    .parallel-nav-button--left {
        left: 33.3333%;
    }

    .parallel-nav-button--right {
        left: 66.6667%;
    }

    .parallel-nav-button__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        line-height: 0;
    }

    .parallel-nav-button__icon :global(svg) {
        display: block;
        width: 16px !important;
        height: 16px !important;
        stroke-width: 2.3 !important;
    }
</style>
