<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import { handleLinks } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/handle-links';
    import { onMount } from 'svelte';
    import { derived } from 'src/lib/store/derived';
    import {
        getMandalaLayout,
    } from 'src/view/helpers/mandala/mandala-grid';
    import { setActiveCell9x9 } from 'src/view/helpers/mandala/set-active-cell-9x9';
    import {
        MandalaBorderOpacityStore,
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        ShowMandalaDetailSidebarStore,
        Show9x9TitleOnlyStore,
    } from 'src/stores/settings/derived/view-settings-store';

    import { Platform } from 'obsidian';
    import { mobileInteractionMode } from 'src/stores/view/mobile-interaction-store';
    import { SectionColorBySectionStore } from 'src/stores/document/derived/section-colors-store';
    import { applyOpacityToHex } from 'src/view/helpers/mandala/section-colors';

    const view = getView();
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const showTitleOnly = Show9x9TitleOnlyStore(view);
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
    const activeCell = derived(
        view.viewStore,
        (state) => state.ui.mandala.activeCell9x9,
    );
    let gridEl: HTMLDivElement | null = null;
    let bodyLineClamp = 3;

    const getBaseTheme = (section: string | undefined) =>
        section ? section.split('.')[0] : '1';

    const escapeHtml = (value: string) =>
        value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');

    const escapeAttribute = (value: string) =>
        value.replaceAll('"', '&quot;').replaceAll("'", '&#39;');

    const buildBodyHtml = (rawBody: string) => {
        let content = escapeHtml(rawBody);

        content = content.replace(/\[\[([^\]]+)\]\]/g, (_, link: string) => {
            const href = escapeAttribute(link.trim());
            const label = link.trim();
            return `<a class="internal-link" data-href="${href}">${label}</a>`;
        });

        content = content.replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            (match, label: string, url: string, offset: number, source: string) => {
                if (offset > 0 && source[offset - 1] === '!') {
                    return match;
                }
                const href = escapeAttribute(url.trim());
                return `<a class="external-link" href="${href}">${label}</a>`;
            },
        );

        return content.replace(/\n/g, '<br />');
    };

    const HEADING_RE = /^\s{0,3}#{1,6}\s+/;
    const isMarkdownHeading = (line: string) => HEADING_RE.test(line);
    const stripHeadingPrefix = (line: string) => line.replace(HEADING_RE, '');

    // Reactive store for cells
    const buildCells = (
        state: ReturnType<typeof view.documentStore.getValue>,
        orientation: string,
        baseTheme: string,
    ) => {
        const layout = getMandalaLayout(
            orientation === 'south-start' || orientation === 'bottom-to-top'
                ? orientation
                : 'left-to-right',
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

                const blockSlot =
                    isCenter
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
                let titleHtml = '';
                let bodyHtml = '';
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
                                titleHtml = buildBodyHtml(
                                    stripHeadingPrefix(firstLine).trim(),
                                );
                                if (restLines.length > 0) {
                                    const rawBody = restLines
                                        .join('\n')
                                        .trim()
                                        .slice(0, 150);
                                    bodyHtml = buildBodyHtml(rawBody);
                                }
                            } else {
                                // Plain first line should be rendered as body text.
                                const rawBody = lines
                                    .join('\n')
                                    .trim()
                                    .slice(0, 150);
                                bodyHtml = buildBodyHtml(rawBody);
                            }
                        }
                    }
                }

                list.push({
                    row,
                    col,
                    section,
                    titleHtml,
                    bodyHtml,
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
            let orientation =
                view.plugin.settings.getValue().view.mandalaGridOrientation ??
                'left-to-right';

            const update = () => {
                const activeNodeId =
                    view.viewStore.getValue().document.activeNode;
                const section = documentState.sections.id_section[activeNodeId];
                const theme = getBaseTheme(section);
                run(buildCells(documentState, orientation, theme));
            };

            const unsubDoc = view.documentStore.subscribe((state) => {
                documentState = state;
                update();
            });

            const unsubSettings = view.plugin.settings.subscribe((settings) => {
                orientation =
                    settings.view.mandalaGridOrientation ?? 'left-to-right';
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
        (typeof $cells)[number] & { background: string | null }
    > = [];

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
                    ? `color-mix(in srgb, var(--mandala-gray-block-base) ${
                          $sectionColorOpacity
                      }%, transparent)`
                    : null;
            return { ...cell, background };
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
        const available = cellBox.height - padding - reservedTitleHeight - reservedGap;
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
        if (!cell.nodeId) {
            setActiveCell9x9(view, { row: cell.row, col: cell.col });
            return;
        }

        // A section can appear in multiple 9x9 cells. Keep the clicked cell
        // as the single visual focus instead of highlighting all same-node copies.
        setActiveCell9x9(view, { row: cell.row, col: cell.col });

        if (Platform.isMobile) {
            // 场景 5：锁定 + 侧栏关 = 无反应
            if ($mobileInteractionMode === 'locked' && !$showDetailSidebar) {
                return;
            }
            // 场景 6, 7, 8：执行选中逻辑
        }

        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse',
            payload: { id: cell.nodeId },
        });

        // 仅在非移动端时保留原有的自动开启逻辑 (为了保护 PC 端逻辑)
        if (!Platform.isMobile && !view.plugin.settings.getValue().view.showMandalaDetailSidebar) {
            view.plugin.settings.dispatch({
                type: 'view/mandala-detail-sidebar/toggle',
            });
        }
    };

    const onCellDblClick = (cell: (typeof styledCells)[number]) => {
        if (!cell.nodeId) {
            setActiveCell9x9(view, { row: cell.row, col: cell.col });
            return;
        }

        // 移动端：9x9 双击格子无功能（编辑仅由右侧栏双击触发）
        if (Platform.isMobile) {
            return;
        }

        if ($mobileInteractionMode === 'locked') {
            // 锁定模式：双击不进入编辑
            return;
        }

        if (Platform.isMobile) {
            if ($mobileInteractionMode === 'unlocked') {
                // 场景 7, 8: 弹出全屏编辑
                view.viewStore.dispatch({
                    type: 'view/editor/enable-main-editor',
                    payload: { nodeId: cell.nodeId, isInSidebar: false },
                });
                return;
            } else {
                // 场景 5: 锁定+侧栏关 = 无反应
                if (!$showDetailSidebar) return;
                // 场景 6: 锁定+侧栏开 = 仅选中 (等同于单击)
                onCellClick(cell);
                return;
            }
        }

        // PC 端逻辑保持不变
        view.viewStore.dispatch({
            type: 'view/editor/enable-sidebar-editor',
            payload: { id: cell.nodeId },
            context: { activeSidebarTab: 'mandala-detail' as any }
        });
    };
</script>

<div
    class="simple-9x9-grid"
    style={`--mandala-border-opacity: ${$borderOpacity}%; --mandala-body-lines: ${bodyLineClamp};`}
    bind:this={gridEl}
>
    {#each styledCells as cell}
        <div 
            class="simple-cell" 
            class:is-center={cell.isCenter}
            class:is-theme-center={cell.isThemeCenter}
            class:is-title-only={$showTitleOnly}
            class:is-active={cell.nodeId && cell.nodeId === $activeNodeId && !$activeCell}
            class:is-active-cell={$activeCell && cell.row === $activeCell.row && cell.col === $activeCell.col}
            class:is-block-row-start={cell.row % 3 === 0}
            class:is-block-col-start={cell.col % 3 === 0}
            class:is-last-row={cell.row === 8}
            class:is-last-col={cell.col === 8}
            style={cell.background
                ? `background-color: ${cell.background};`
                : undefined}
            data-node-id={cell.nodeId || undefined}
            id={cell.nodeId || undefined}
            on:click={() => onCellClick(cell)}
            on:dblclick={() => onCellDblClick(cell)}
        >
            <div class="cell-content">
                {#if cell.titleHtml}
                    <div
                        class="cell-title"
                        on:click={(event) => handleLinks(view, event)}
                    >
                        {@html cell.titleHtml}
                    </div>
                {/if}
                {#if !$showTitleOnly && cell.bodyHtml}
                    <div
                        class="cell-body"
                        on:click={(event) => handleLinks(view, event)}
                    >
                        {@html cell.bodyHtml}
                    </div>
                {/if}
            </div>
            {#if cell.section}
                 <span class="cell-debug">{cell.section}</span>
            {/if}
        </div>
    {/each}
</div>

<style>
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
        font-size: 1em;
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
    .is-theme-center .cell-title {
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
</style>
