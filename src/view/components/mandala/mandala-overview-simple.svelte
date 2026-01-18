<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import { derived } from 'src/lib/store/derived';
    import {
        coreGrid,
        themeBlocks,
        themeGrid,
    } from 'src/view/helpers/mandala/mandala-grid';
    import { ShowMandalaDetailSidebarStore, Show9x9TitleOnlyStore } from 'src/stores/settings/derived/view-settings-store';

    import { Platform } from 'obsidian';
    import { mobileInteractionMode } from 'src/stores/view/mobile-interaction-store';
    import { SectionColorBySectionStore } from 'src/stores/document/derived/section-colors-store';

    const view = getView();
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const showTitleOnly = Show9x9TitleOnlyStore(view);
    const sectionColors = SectionColorBySectionStore(view);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );

    // Reactive store for cells
    const cells = derived(view.documentStore, (state) => {
        const list = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                // 1. Calculate Section ID
                let section: string | null = null;
                const blockRow = Math.floor(row / 3);
                const blockCol = Math.floor(col / 3);
                const localRow = row % 3;
                const localCol = col % 3;

                // Center Block (1,1) -> Core Grid (1-9)
                if (blockRow === 1 && blockCol === 1) {
                    section = coreGrid[localRow][localCol];
                } else {
                    // Outer Blocks -> Theme Expansion
                    const theme = themeBlocks[blockRow * 3 + blockCol];
                    if (theme) {
                        // Center of outer block -> Theme Title
                        if (localRow === 1 && localCol === 1) {
                            section = theme;
                        } else {
                            // Surrounding -> Theme Children
                            const slot = themeGrid[localRow][localCol];
                            if (slot) {
                                section = `${theme}.${slot}`;
                            }
                        }
                    }
                }

                // 2. Get Content if Section exists
                let title = '';
                let body = '';
                let nodeId = '';
                let isCenter = blockRow === 1 && blockCol === 1;
                let isThemeCenter = !isCenter && localRow === 1 && localCol === 1;

                if (section) {
                    const id = state.sections.section_id[section];
                    if (id) {
                        nodeId = id;
                        const nodeContent = state.document.content[nodeId]?.content;
                        if (nodeContent) {
                            // Extract title and body
                            const lines = nodeContent.split('\n');
                            const rawTitle = lines[0] || '';
                            title = rawTitle.replace(/^#+\s*/, '').trim();
                            
                            // Body: Join remaining lines, remove standard markdown syntax for cleaner preview
                            if (lines.length > 1) {
                                body = lines.slice(1).join(' ')
                                    .replace(/\[\[.*?\]\]/g, (m) => m.slice(2, -2)) // Simplify links
                                    .replace(/[*_`]/g, '') // Remove formatting chars
                                    .trim()
                                    .slice(0, 150); // Limit chars
                            }
                        }
                    }
                }

                list.push({
                    row,
                    col,
                    section,
                    title,
                    body,
                    nodeId,
                    isCenter,
                    isThemeCenter
                });
            }
        }
        return list;
    });

    const onCellClick = (nodeId: string) => {
        if (!nodeId) return;

        if (Platform.isMobile) {
            // 场景 5：锁定 + 侧栏关 = 无反应
            if ($mobileInteractionMode === 'locked' && !$showDetailSidebar) {
                return;
            }
            // 场景 6, 7, 8：执行选中逻辑
        }

        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse',
            payload: { id: nodeId },
        });

        // 仅在非移动端时保留原有的自动开启逻辑 (为了保护 PC 端逻辑)
        if (!Platform.isMobile && !view.plugin.settings.getValue().view.showMandalaDetailSidebar) {
            view.plugin.settings.dispatch({
                type: 'view/mandala-detail-sidebar/toggle',
            });
        }
    };

    const onCellDblClick = (nodeId: string) => {
        if (!nodeId) return;

        if ($mobileInteractionMode === 'locked') {
            // 锁定模式：双击不进入编辑
            return;
        }

        if (Platform.isMobile) {
            if ($mobileInteractionMode === 'unlocked') {
                // 场景 7, 8: 弹出全屏编辑
                view.viewStore.dispatch({
                    type: 'view/editor/enable-main-editor',
                    payload: { nodeId: nodeId, isInSidebar: false },
                });
                return;
            } else {
                // 场景 5: 锁定+侧栏关 = 无反应
                if (!$showDetailSidebar) return;
                // 场景 6: 锁定+侧栏开 = 仅选中 (等同于单击)
                onCellClick(nodeId);
                return;
            }
        }

        // PC 端逻辑保持不变
        view.viewStore.dispatch({
            type: 'view/editor/enable-sidebar-editor',
            payload: { id: nodeId },
            context: { activeSidebarTab: 'mandala-detail' as any }
        });
    };
</script>

<div class="simple-9x9-grid">
    {#each $cells as cell}
        <div 
            class="simple-cell" 
            class:is-center={cell.isCenter}
            class:is-theme-center={cell.isThemeCenter}
            class:is-title-only={$showTitleOnly}
            class:is-active={cell.nodeId && cell.nodeId === $activeNodeId}
            class:is-block-row-start={cell.row % 3 === 0}
            class:is-block-col-start={cell.col % 3 === 0}
            class:is-last-row={cell.row === 8}
            class:is-last-col={cell.col === 8}
            style={cell.section && $sectionColors[cell.section]
                ? `background-color: ${$sectionColors[cell.section]};`
                : undefined}
            data-node-id={cell.nodeId || undefined}
            id={cell.nodeId || undefined}
            on:click={() => onCellClick(cell.nodeId)}
            on:dblclick={() => onCellDblClick(cell.nodeId)}
        >
            <div class="cell-content">
                {#if cell.title}
                    <div class="cell-title">{cell.title}</div>
                {/if}
                {#if !$showTitleOnly && cell.body}
                    <div class="cell-body">{cell.body}</div>
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
    }

    .simple-cell {
        background-color: var(--background-primary);
        border-left: 1px dashed var(--text-normal);
        border-top: 1px dashed var(--text-normal);
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
        border-top: 3px solid var(--text-normal);
    }

    .simple-cell.is-block-col-start {
        border-left: 3px solid var(--text-normal);
    }

    .simple-cell.is-last-row {
        border-bottom: 3px solid var(--text-normal);
    }

    .simple-cell.is-last-col {
        border-right: 3px solid var(--text-normal);
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
        -webkit-line-clamp: 3; /* Show up to 3 lines of body */
        -webkit-box-orient: vertical;
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

    .simple-cell.is-active {
        outline: 2px solid var(--mandala-color-selection);
        outline-offset: -2px;
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
