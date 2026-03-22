<script lang="ts">
    import { Platform } from 'obsidian';
    import type {
        SimpleSummaryActiveCell,
        SimpleSummaryCellModel,
    } from 'src/mandala-cell/model/simple-summary-cell-model';
    import SimpleSummaryCell from 'src/mandala-cell/view/components/simple-summary-cell.svelte';
    import MandalaNavIcon from 'src/mandala-scenes/shared/mandala-nav-icon.svelte';
    import { onMount } from 'svelte';
    import { derived } from 'src/lib/store/derived';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { jumpCoreTheme } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/jump-core-theme';
    import {
        MandalaBorderOpacityStore,
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        Show9x9ParallelNavButtonsStore,
        Show9x9TitleOnlyStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { SectionColorBySectionStore } from 'src/stores/cell/section-colors-store';
    import type { ThemeTone } from 'src/helpers/views/mandala/contrast-text-tone';
    import {
        build9x9CellViewModels,
        decorate9x9CellViewModels,
        getBaseTheme,
        toActiveSummaryCell,
    } from 'src/mandala-scenes/view-9x9/assemble-cell-view-model';

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
    const idToSection = derived(
        view.documentStore,
        (state) => state.sections.id_section,
    );
    const activeCellStore = derived(
        view.viewStore,
        (state) => state.ui.mandala.activeCell9x9,
    );
    const swapState = derived(view.viewStore, (state) => state.ui.mandala.swap);
    const hasOpenOverlayModal = derived(view.viewStore, (state) => {
        const controls = state.ui.controls;
        return controls.showHelpSidebar || controls.showSettingsSidebar;
    });

    let gridEl: HTMLDivElement | null = null;
    let bodyLineClamp = 3;
    let currentCoreNumber = 1;
    let cells: SimpleSummaryCellModel[] = [];
    let currentActiveCell: SimpleSummaryActiveCell = null;

    $: {
        const section = $idToSection[$activeNodeId];
        const nextCore = Number(getBaseTheme(section));
        currentCoreNumber = Number.isFinite(nextCore) ? nextCore : 1;
    }

    const buildCells = (
        state: ReturnType<typeof view.documentStore.getValue>,
        nextSelectedLayoutId: string,
        nextCustomLayouts: ReturnType<
            typeof view.plugin.settings.getValue
        >['view']['mandalaGridCustomLayouts'],
        baseTheme: string,
    ) =>
        build9x9CellViewModels({
            documentState: state,
            selectedLayoutId: nextSelectedLayoutId,
            customLayouts: nextCustomLayouts,
            baseTheme,
        });

    const cellsStore = {
        subscribe: (run: (value: ReturnType<typeof buildCells>) => void) => {
            let documentState = view.documentStore.getValue();
            let nextSelectedLayoutId = view.getCurrentMandalaLayoutId();
            let nextCustomLayouts =
                view.plugin.settings.getValue().view.mandalaGridCustomLayouts ??
                [];

            const update = () => {
                const activeNodeId =
                    view.viewStore.getValue().document.activeNode;
                const section = documentState.sections.id_section[activeNodeId];
                const theme = getBaseTheme(section);
                run(
                    buildCells(
                        documentState,
                        nextSelectedLayoutId,
                        nextCustomLayouts,
                        theme,
                    ),
                );
            };

            const unsubDoc = view.documentStore.subscribe((state) => {
                documentState = state;
                update();
            });

            const unsubSettings = view.plugin.settings.subscribe((settings) => {
                nextSelectedLayoutId = view.getCurrentMandalaLayoutId(
                    settings,
                );
                nextCustomLayouts = settings.view.mandalaGridCustomLayouts ?? [];
                update();
            });

            const unsubTheme = view.viewStore.subscribe(() => {
                update();
            });

            update();

            return () => {
                unsubDoc();
                unsubSettings();
                unsubTheme();
            };
        },
    };

    const getThemeTone = (): ThemeTone =>
        document.body.classList.contains('theme-dark') ? 'dark' : 'light';

    const getThemeUnderlayColor = () =>
        window
            .getComputedStyle(document.body)
            .getPropertyValue('--background-primary')
            .trim();

    $: {
        cells = decorate9x9CellViewModels({
            cells: $cellsStore,
            backgroundMode: $backgroundMode,
            sectionColors: $sectionColors,
            sectionColorOpacity: $sectionColorOpacity,
            themeTone: getThemeTone(),
            themeUnderlayColor: getThemeUnderlayColor(),
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
        updateBodyClamp();
        if (!gridEl) return;
        const observer = new ResizeObserver(() => updateBodyClamp());
        observer.observe(gridEl);
        return () => observer.disconnect();
    });

    const jumpToPrevCore = (event: MouseEvent) => {
        event.stopPropagation();
        jumpCoreTheme(view, 'up');
    };

    const jumpToNextCore = (event: MouseEvent) => {
        event.stopPropagation();
        jumpCoreTheme(view, 'down');
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
            />
        {/each}
    </div>

    {#if !Platform.isMobile &&
        $show9x9ParallelNavButtons &&
        !$hasOpenOverlayModal}
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
                <MandalaNavIcon
                    direction="right"
                    size={16}
                    strokeWidth={2.3}
                />
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
            0 0 0 1px color-mix(
                in srgb,
                var(--interactive-accent) 45%,
                transparent
            ),
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
