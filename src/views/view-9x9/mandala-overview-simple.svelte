<script lang="ts">
    import SimpleSummaryCell from 'src/cell/display/components/simple-summary-cell.svelte';
    import type { SimpleSummaryCellModel } from 'src/cell/model/simple-summary-cell-model';
    import { getView } from 'src/views/shared/shell/context';
    import { jumpCoreTheme } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/jump-core-theme';
    import { onMount } from 'svelte';
    import { derived } from 'src/lib/store/derived';
    import { getMandalaLayoutById } from 'src/view/helpers/mandala/mandala-grid';
    import {
        MandalaBorderOpacityStore,
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        Show9x9ParallelNavButtonsStore,
        Show9x9TitleOnlyStore,
    } from 'src/stores/settings/derived/view-settings-store';

    import { Platform } from 'obsidian';
    import { SectionColorBySectionStore } from 'src/stores/cell/section-colors-store';
    import { applyOpacityToHex } from 'src/lib/mandala/section-colors';
    import MandalaNavIcon from 'src/views/shared/mandala-nav-icon.svelte';
    import {
        getReadableTextTone,
        type ThemeTone,
    } from 'src/helpers/views/mandala/contrast-text-tone';
    import {
        type SimpleSummaryActiveCell,
    } from 'src/cell/model/simple-summary-cell-model';

    const view = getView();
    const showTitleOnly = Show9x9TitleOnlyStore(view);
    const show9x9ParallelNavButtons = Show9x9ParallelNavButtonsStore(view);
    const sectionColors = SectionColorBySectionStore(view);
    const borderOpacity = MandalaBorderOpacityStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const isCrossBlock = (blockRow: number, blockCol: number) =>
        (blockRow === 0 && blockCol === 1) ||
        (blockRow === 1 && blockCol === 0) ||
        (blockRow === 1 && blockCol === 2) ||
        (blockRow === 2 && blockCol === 1);
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

    const getBaseTheme = (section: string | undefined) =>
        section ? section.split('.')[0] : '1';

    $: {
        const section = $idToSection[$activeNodeId];
        const nextCore = Number(getBaseTheme(section));
        currentCoreNumber = Number.isFinite(nextCore) ? nextCore : 1;
    }

    const normalizeCellPreviewText = (raw: string) =>
        raw
            .replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, '')
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/^\s*\d+\.\s+/gm, '')
            .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
            .replace(/\[\[([^\]]+)\]\]/g, '$1')
            .replace(/\s+/g, ' ')
            .trim();

    const buildCellMarkdown = (rawBody: string) =>
        normalizeCellPreviewText(rawBody).slice(0, 150);

    const HEADING_RE = /^\s{0,3}#{1,6}\s+/;
    const isMarkdownHeading = (line: string) => HEADING_RE.test(line);
    const stripHeadingPrefix = (line: string) => line.replace(HEADING_RE, '');

    // Reactive store for cells
    const buildCells = (
        state: ReturnType<typeof view.documentStore.getValue>,
        nextSelectedLayoutId: string,
        nextCustomLayouts: ReturnType<
            typeof view.plugin.settings.getValue
        >['view']['mandalaGridCustomLayouts'],
        baseTheme: string,
    ) => {
        const layout = getMandalaLayoutById(
            nextSelectedLayoutId,
            nextCustomLayouts,
        );
        const list = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                // 1. Calculate Section ID
                let section: string | null = null;
                const blockRow = Math.floor(row / 3);
                const blockCol = Math.floor(col / 3);
                const localRow = row % 3;
                const localCol = col % 3;
                const isCenter = blockRow === 1 && blockCol === 1;
                const isThemeCenter = localRow === 1 && localCol === 1;
                let isGrayBlock = false;

                const blockSlot = isCenter
                    ? null
                    : layout.themeGrid[blockRow]?.[blockCol] ?? null;
                const theme = blockSlot
                    ? `${baseTheme}.${blockSlot}`
                    : baseTheme;
                if (!isCenter && isCrossBlock(blockRow, blockCol)) {
                    isGrayBlock = true;
                }

                if (isThemeCenter) {
                    section = theme;
                } else {
                    const slot = layout.themeGrid[localRow]?.[localCol];
                    if (slot) {
                        section = `${theme}.${slot}`;
                    }
                }

                // 2. Get Content if Section exists
                let titleMarkdown = '';
                let bodyMarkdown = '';
                let nodeId = '';

                if (section) {
                    const id = state.sections.section_id[section];
                    if (id) {
                        nodeId = id;
                        const nodeContent =
                            state.document.content[nodeId]?.content;
                        if (nodeContent) {
                            const lines = nodeContent.split('\n');
                            const firstLine = lines[0]?.trim() ?? '';
                            const restLines = lines.slice(1);

                            // Only markdown headings use title style.
                            if (firstLine && isMarkdownHeading(firstLine)) {
                                titleMarkdown = buildCellMarkdown(
                                    stripHeadingPrefix(firstLine).trim(),
                                );
                                if (restLines.length > 0) {
                                    const rawBody = restLines
                                        .join('\n')
                                        .trim()
                                        .slice(0, 150);
                                    bodyMarkdown = buildCellMarkdown(rawBody);
                                }
                            } else {
                                // Plain first line should be rendered as body text.
                                const rawBody = lines
                                    .join('\n')
                                    .trim()
                                    .slice(0, 150);
                                bodyMarkdown = buildCellMarkdown(rawBody);
                            }
                        }
                    }
                }

                list.push({
                    row,
                    col,
                    section,
                    titleMarkdown,
                    bodyMarkdown,
                    nodeId,
                    isCenter,
                    isThemeCenter,
                    isGrayBlock,
                });
            }
        }
        return list;
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

    const DARK_TEXT_TOKENS =
        '--text-normal: #0f131a; --text-muted: #2f3a48; --text-faint: #4f5c6b; --text-accent: #0f131a;';

    const LIGHT_TEXT_TOKENS =
        '--text-normal: #f3f6fd; --text-muted: #d0d8e6; --text-faint: #b0bbce; --text-accent: #f3f6fd;';

    const getThemeTone = (): ThemeTone =>
        document.body.classList.contains('theme-dark') ? 'dark' : 'light';

    const getThemeUnderlayColor = () =>
        window
            .getComputedStyle(document.body)
            .getPropertyValue('--background-primary')
            .trim();

    $: {
        const opacity = $sectionColorOpacity / 100;
        styledCells = $cells.map((cell) => {
            const sectionColor =
                $backgroundMode === 'custom' && cell.section
                    ? $sectionColors[cell.section]
                    : null;
            const background = sectionColor
                ? applyOpacityToHex(sectionColor, opacity)
                : $backgroundMode === 'gray' && cell.isGrayBlock
                  ? `color-mix(in srgb, var(--mandala-gray-block-base) ${$sectionColorOpacity}%, transparent)`
                  : null;
            const textTone = background
                ? getReadableTextTone(
                      background,
                      getThemeTone(),
                      getThemeUnderlayColor(),
                  )
                : null;

            const styleParts = [];
            if (background) styleParts.push(`background-color: ${background};`);
            if (textTone === 'dark') styleParts.push(DARK_TEXT_TOKENS);
            if (textTone === 'light') styleParts.push(LIGHT_TEXT_TOKENS);

            return {
                ...cell,
                background,
                textTone,
                style: styleParts.length > 0 ? styleParts.join(' ') : null,
            };
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

    $: currentActiveCell = $activeCell
        ? { row: $activeCell.row, col: $activeCell.col }
        : null;
</script>

<div class="simple-9x9-shell">
    <div
        class="simple-9x9-grid"
        style={`--mandala-border-opacity: ${$borderOpacity}%; --mandala-body-lines: ${bodyLineClamp};`}
        bind:this={gridEl}
    >
        {#each styledCells as cell (`${cell.row}-${cell.col}`)}
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
