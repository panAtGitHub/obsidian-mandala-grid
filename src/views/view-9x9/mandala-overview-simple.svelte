<script lang="ts">
    import type { SimpleSummaryCellModel } from 'src/cell/model/simple-summary-cell-model';
    import type { SimpleSummaryActiveCell } from 'src/cell/model/simple-summary-cell-model';
    import { getView } from 'src/views/shared/shell/context';
    import { jumpCoreTheme } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/jump-core-theme';
    import { onMount } from 'svelte';
    import { derived } from 'src/lib/store/derived';
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
    } from 'src/views/view-9x9/assemble-cell-view-model';
    import NineByNineLayout from 'src/views/view-9x9/layout.svelte';
    import {
        type SimpleSummaryActiveCell as ActiveCellType,
    } from 'src/cell/model/simple-summary-cell-model';

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
    const activeCell = derived(
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
    ) => {
        return build9x9CellViewModels({
            documentState: state,
            selectedLayoutId: nextSelectedLayoutId,
            customLayouts: nextCustomLayouts,
            baseTheme,
        });
    };

    const cells = {
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

    let styledCells: SimpleSummaryCellModel[] = [];

    const getThemeTone = (): ThemeTone =>
        document.body.classList.contains('theme-dark') ? 'dark' : 'light';

    const getThemeUnderlayColor = () =>
        window
            .getComputedStyle(document.body)
            .getPropertyValue('--background-primary')
            .trim();

    $: {
        styledCells = decorate9x9CellViewModels({
            cells: $cells,
            backgroundMode: $backgroundMode,
            sectionColors: $sectionColors,
            sectionColorOpacity: $sectionColorOpacity,
            themeTone: getThemeTone(),
            themeUnderlayColor: getThemeUnderlayColor(),
        });
    }

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

    let currentActiveCell: SimpleSummaryActiveCell = null;

    $: currentActiveCell = toActiveSummaryCell($activeCell as ActiveCellType);
</script>

<NineByNineLayout
    cells={styledCells}
    activeNodeId={$activeNodeId}
    activeCell={currentActiveCell}
    showTitleOnly={$showTitleOnly}
    swapState={$swapState}
    borderOpacity={$borderOpacity}
    {bodyLineClamp}
    showParallelNavButtons={$show9x9ParallelNavButtons}
    hasOpenOverlayModal={$hasOpenOverlayModal}
    {currentCoreNumber}
    bind:gridEl
    {jumpToPrevCore}
    {jumpToNextCore}
/>
