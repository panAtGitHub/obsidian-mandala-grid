<script lang="ts">
    import { getView } from 'src/views/shared/shell/context';
    import { jumpCoreTheme } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/jump-core-theme';
    import { onMount } from 'svelte';
    import {
        openSidebarAndEditMandalaNode,
        setActiveMandalaNode,
    } from 'src/helpers/views/mandala/node-editing';
    import { derived } from 'src/lib/store/derived';
    import { getMandalaLayoutById } from 'src/view/helpers/mandala/mandala-grid';
    import { setActiveCell9x9 } from 'src/helpers/views/mandala/set-active-cell-9x9';
    import {
        executeMandalaSwap,
        handleMandalaSwapNodeClick,
        shouldBlockMandalaNodeDoubleClickForSwap,
    } from 'src/view/helpers/mandala/mandala-swap';
    import {
        MandalaBorderOpacityStore,
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        Show9x9ParallelNavButtonsStore,
        Show9x9TitleOnlyStore,
    } from 'src/stores/settings/derived/view-settings-store';

    import { Platform } from 'obsidian';
    import { SectionColorBySectionStore } from 'src/stores/cell/section-colors-store';
    import { applyOpacityToHex } from 'src/view/helpers/mandala/section-colors';
    import MandalaNavIcon from 'src/views/shared/mandala-nav-icon.svelte';
    import {
        getReadableTextTone,
        type ThemeTone,
    } from 'src/view/helpers/mandala/contrast-text-tone';

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

    let styledCells: Array<
        (typeof $cells)[number] & {
            background: string | null;
            textTone: 'dark' | 'light' | null;
            style: string | null;
        }
    > = [];

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

    const onCellClick = (cell: (typeof styledCells)[number]) => {
        if ($swapState.active) {
            return;
        }

        if (!cell.nodeId) {
            setActiveCell9x9(view, { row: cell.row, col: cell.col });
            return;
        }

        // A section can appear in multiple 9x9 cells. Keep the clicked cell
        // as the single visual focus instead of highlighting all same-node copies.
        setActiveCell9x9(view, { row: cell.row, col: cell.col });

        setActiveMandalaNode(view, cell.nodeId);
    };

    const onCellMouseDown = (
        cell: (typeof styledCells)[number],
        event: MouseEvent,
    ) => {
        if (!cell.nodeId) return;
        if (
            handleMandalaSwapNodeClick(
                $swapState,
                cell.nodeId,
                (source, target) => executeMandalaSwap(view, source, target),
            )
        ) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    const onCellTouchStart = (
        cell: (typeof styledCells)[number],
        event: TouchEvent,
    ) => {
        if (!cell.nodeId) return;
        if (
            handleMandalaSwapNodeClick(
                $swapState,
                cell.nodeId,
                (source, target) => executeMandalaSwap(view, source, target),
            )
        ) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    const onCellDblClick = (cell: (typeof styledCells)[number]) => {
        if (shouldBlockMandalaNodeDoubleClickForSwap($swapState)) {
            return;
        }

        if (!cell.nodeId) {
            setActiveCell9x9(view, { row: cell.row, col: cell.col });
            return;
        }

        // 移动端：9x9 双击格子无功能（编辑仅由右侧栏双击触发）
        if (Platform.isMobile) {
            return;
        }

        openSidebarAndEditMandalaNode(view, cell.nodeId);
    };

    const jumpToPrevCore = (event: MouseEvent) => {
        event.stopPropagation();
        jumpCoreTheme(view, 'up');
    };

    const jumpToNextCore = (event: MouseEvent) => {
        event.stopPropagation();
        jumpCoreTheme(view, 'down');
    };

    const renderCellMarkdown = (element: HTMLElement, content: string) => {
        const render = () => {
            element.empty();
            if (!content) {
                return;
            }
            // 81格预览使用纯文本摘要，避免Markdown块级DOM在极小网格中造成布局错乱。
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
</script>

<div class="simple-9x9-shell">
    <div
        class="simple-9x9-grid"
        style={`--mandala-border-opacity: ${$borderOpacity}%; --mandala-body-lines: ${bodyLineClamp};`}
        bind:this={gridEl}
    >
        {#each styledCells as cell (`${cell.row}-${cell.col}`)}
            <div
                class="simple-cell"
                class:is-center={cell.isCenter}
                class:is-theme-center={cell.isThemeCenter}
                class:is-title-only={$showTitleOnly}
                class:is-active={cell.nodeId &&
                    cell.nodeId === $activeNodeId &&
                    !$activeCell}
                class:is-active-cell={$activeCell &&
                    cell.row === $activeCell.row &&
                    cell.col === $activeCell.col}
                class:is-block-row-start={cell.row % 3 === 0}
                class:is-block-col-start={cell.col % 3 === 0}
                class:is-last-row={cell.row === 8}
                class:is-last-col={cell.col === 8}
                class:has-custom-background={Boolean(cell.background)}
                class:simple-cell--swap-source={$swapState.active &&
                    $swapState.sourceNodeId === cell.nodeId}
                class:simple-cell--swap-target={$swapState.active &&
                    !!cell.nodeId &&
                    $swapState.targetNodeIds.has(cell.nodeId)}
                class:simple-cell--swap-disabled={$swapState.active &&
                    !!cell.nodeId &&
                    !$swapState.targetNodeIds.has(cell.nodeId) &&
                    $swapState.sourceNodeId !== cell.nodeId}
                style={cell.style ?? undefined}
                data-node-id={cell.nodeId || undefined}
                id={cell.nodeId || undefined}
                on:mousedown={(event) => onCellMouseDown(cell, event)}
                on:touchstart={(event) => onCellTouchStart(cell, event)}
                on:click={() => onCellClick(cell)}
                on:dblclick={() => onCellDblClick(cell)}
            >
                <div class="cell-content">
                    {#if cell.titleMarkdown}
                        <div class="cell-title" use:renderCellMarkdown={cell.titleMarkdown}>
                        </div>
                    {/if}
                    {#if !$showTitleOnly && cell.bodyMarkdown}
                        <div class="cell-body" use:renderCellMarkdown={cell.bodyMarkdown}>
                        </div>
                    {/if}
                </div>
                {#if cell.section}
                    <span class="cell-debug">{cell.section}</span>
                {/if}
            </div>
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

    .simple-cell {
        background-color: var(--background-primary);
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        border-radius: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: 6px;
        position: relative;
        user-select: none;
        box-sizing: border-box;
    }

    .simple-cell.is-block-row-start {
        border-top: 3px solid var(--mandala-border-color);
    }

    .simple-cell.is-block-col-start {
        border-left: 3px solid var(--mandala-border-color);
    }

    .simple-cell.is-last-row {
        border-bottom: 3px solid var(--mandala-border-color);
    }

    .simple-cell.is-last-col {
        border-right: 3px solid var(--mandala-border-color);
    }

    .cell-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        height: 100%;
    }

    .cell-title {
        font-size: var(--mandala-h1-size, 1em);
        font-weight: 600;
        line-height: 1.2;
        color: var(--text-normal);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2; /* Allow title to wrap once */
        -webkit-box-orient: vertical;
        flex-shrink: 0;
    }

    .cell-body {
        font-size: 0.9em;
        color: var(--text-muted);
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: var(--mandala-body-lines, 3);
        -webkit-box-orient: vertical;
        white-space: pre-wrap;
        word-break: break-all;
    }

    .is-center {
        background-color: var(--background-secondary-alt);
        border-color: var(--text-muted);
    }

    .is-theme-center {
        background-color: var(--background-primary-alt);
    }

    /* Theme center gets slightly larger/bolder title focus */
    .is-theme-center:not(.has-custom-background) .cell-title {
        font-weight: 700;
        color: var(--text-accent);
    }

    .simple-cell.is-active,
    .simple-cell.is-active-cell {
        position: relative;
    }

    .simple-cell.is-active::after,
    .simple-cell.is-active-cell::after {
        content: '';
        position: absolute;
        inset: 2px;
        border: 2px solid var(--mandala-selection-color);
        pointer-events: none;
        box-sizing: border-box;
        border-radius: 0;
    }

    .simple-cell--swap-source,
    .simple-cell--swap-target {
        box-shadow: inset 0 0 0 2px var(--interactive-accent);
    }

    .simple-cell--swap-target {
        cursor: pointer;
    }

    .simple-cell--swap-disabled {
        opacity: 0.6;
    }

    .cell-debug {
        position: absolute;
        bottom: 1px;
        right: 1px;
        font-size: 8px;
        color: var(--text-faint);
        opacity: 0.5;
        pointer-events: none;
    }
    .simple-cell.is-title-only .cell-content {
        justify-content: center;
        align-items: center;
        height: 100%;
    }

    .simple-cell.is-title-only .cell-title {
        display: block;
        -webkit-line-clamp: unset;
        -webkit-box-orient: unset;
        text-align: center;
        white-space: normal;
        word-break: break-word;
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
