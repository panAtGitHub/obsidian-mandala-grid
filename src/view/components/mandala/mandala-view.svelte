<script lang="ts">
    import { Platform } from 'obsidian';
    import { onDestroy, onMount } from 'svelte';
    import { derived } from 'src/lib/store/derived';
    import {
        MandalaA4ModeStore,
        MandalaA4OrientationStore,
        MandalaBorderOpacityStore,
        MandalaDetailSidebarWidthStore,
        MandalaModeStore,
        MandalaBackgroundModeStore,
        MandalaGridOrientationStore,
        MandalaSectionColorOpacityStore,
        Show3x3SubgridNavButtonsStore,
        ShowMandalaDetailSidebarStore,
        SquareLayoutStore,
        WhiteThemeModeStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { getView } from 'src/view/components/container/context';
    import MandalaCard from 'src/view/components/mandala/mandala-card.svelte';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
    import {
        getMandalaLayout,
        posOfSection9x9,
        sectionAtCell9x9,
    } from 'src/view/helpers/mandala/mandala-grid';
    import { setActiveCell9x9 } from 'src/view/helpers/mandala/set-active-cell-9x9';
    import MandalaOverviewSimple from 'src/view/components/mandala/mandala-overview-simple.svelte';
    import { flip } from 'svelte/animate';
    import VerticalToolbar from 'src/view/components/container/toolbar-vertical/vertical-toolbar.svelte';
    import Toolbar from 'src/view/components/container/toolbar/toolbar.svelte';
    import ToolbarCenter from 'src/view/components/container/toolbar/toolbar-center.svelte';
    import MandalaDetailSidebar from './mandala-detail-sidebar.svelte';
    import { createLayoutStore } from 'src/stores/view/orientation-store';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import MobileFullScreenSearch from 'src/view/components/mandala/mobile-fullscreen-search.svelte';

    import InlineEditor from 'src/view/components/container/column/components/group/components/card/components/content/inline-editor.svelte';
    import { mobilePopupFontSizeStore } from 'src/stores/mobile-popup-font-store';
    import { SectionColorBySectionStore } from 'src/stores/document/derived/section-colors-store';
    import { applyOpacityToHex } from 'src/view/helpers/mandala/section-colors';
    import { findChildGroup } from 'src/lib/tree-utils/find/find-child-group';
    import {
        enterSubgridForNode,
        exitCurrentSubgrid,
    } from 'src/view/helpers/mandala/mobile-navigation';
    import MandalaNavIcon from 'src/view/components/mandala/mandala-nav-icon.svelte';
    import { parseDayPlanFrontmatter } from 'src/lib/mandala/day-plan';

    const view = getView();
    const layout = createLayoutStore();
    const search = searchStore(view);

    // 默认九宫格大小（如果是移动端且开启该逻辑）
    $: squareSize = $layout.squareSize;
    $: isPortrait = $layout.isPortrait;

    const mode = MandalaModeStore(view);
    const gridOrientation = MandalaGridOrientationStore(view);
    const a4Mode = MandalaA4ModeStore(view);
    const a4Orientation = MandalaA4OrientationStore(view);
    const borderOpacity = MandalaBorderOpacityStore(view);
    const show3x3SubgridNavButtons = Show3x3SubgridNavButtonsStore(view);

    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const detailSidebarWidth = MandalaDetailSidebarWidthStore(view);
    const squareLayout = SquareLayoutStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);
    const sectionColors = SectionColorBySectionStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);

    const isCrossPosition = (row: number, col: number) =>
        (row === 0 && col === 1) ||
        (row === 1 && col === 0) ||
        (row === 1 && col === 2) ||
        (row === 2 && col === 1);

    const isCrossIndex = (index: number) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        return isCrossPosition(row, col);
    };
    const getSectionBackground = (
        section: string,
        index: number,
        backgroundMode: string,
        sectionColors: Record<string, string>,
        sectionColorOpacity: number,
    ) => {
        const opacity = sectionColorOpacity / 100;
        if (backgroundMode === 'custom' && sectionColors[section]) {
            return applyOpacityToHex(sectionColors[section], opacity);
        }
        if (backgroundMode === 'gray' && isCrossIndex(index)) {
            return `color-mix(in srgb, var(--mandala-gray-block-base) ${
                sectionColorOpacity
            }%, transparent)`;
        }
        return null;
    };

    const getBaseTheme = (section: string | undefined) =>
        section ? section.split('.')[0] : '1';

    const MIN_DESKTOP_DETAIL_SIDEBAR_SIZE = 200;


    let desktopSquareSize = 0;
    let contentWrapperRef: HTMLElement | null = null;
    let contentWrapperObserver: ResizeObserver | null = null;

    const recomputeDesktopSquareSize = () => {
        if (Platform.isMobile || !$squareLayout || !contentWrapperRef) {
            desktopSquareSize = 0;
            return;
        }

        const rect = contentWrapperRef.getBoundingClientRect();
        const sidebarMinWidth = $showDetailSidebar
            ? Math.max(
                  MIN_DESKTOP_DETAIL_SIDEBAR_SIZE,
                  $detailSidebarWidth || MIN_DESKTOP_DETAIL_SIDEBAR_SIZE,
              )
            : 0;
        const availableWidth = Math.max(0, rect.width - sidebarMinWidth);
        desktopSquareSize = Math.floor(
            Math.max(0, Math.min(rect.height, availableWidth)),
        );
    };

    $: view.mandalaMode = $mode;

    const sectionToNodeId = derived(
        view.documentStore,
        (state) => state.sections.section_id,
    );
    const idToSection = derived(
        view.documentStore,
        (state) => state.sections.id_section,
    );
    const pinnedNodes = derived(
        view.documentStore,
        (state) => new Set(state.pinnedNodes.Ids),
    );
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );

    const subgridTheme = derived(
        view.viewStore,
        (state) => state.ui.mandala.subgridTheme,
    );
    const documentState = derived(view.documentStore, (state) => state);
    const swapState = derived(view.viewStore, (state) => state.ui.mandala.swap);
    const nodeStyles = derived(
        view.viewStore,
        (state) => state.styleRules.nodeStyles,
    );
    const hasOpenOverlayModal = derived(view.viewStore, (state) => {
        const controls = state.ui.controls;
        return (
            controls.showHelpSidebar ||
            controls.showSettingsSidebar ||
            controls.showHistorySidebar ||
            controls.showStyleRulesModal
        );
    });

    let containerRef: HTMLElement | null = null;
    onMount(() => {
        view.container = containerRef;
        focusContainer(view);

        contentWrapperObserver = new ResizeObserver(() => {
            recomputeDesktopSquareSize();
        });
        if (contentWrapperRef) {
            contentWrapperObserver.observe(contentWrapperRef);
        }
        recomputeDesktopSquareSize();
    });

    onDestroy(() => {
        contentWrapperObserver?.disconnect();
        contentWrapperObserver = null;
    });

    $: if (!Platform.isMobile) {
        $squareLayout;
        $showDetailSidebar;
        $detailSidebarWidth;
        recomputeDesktopSquareSize();
    }

    const requireNodeId = (section: string) => {
        const nodeId = $sectionToNodeId[section];
        return nodeId || null;
    };

    const editingState = derived(
        view.viewStore,
        (state) => state.document.editing,
    );

    const selectedNodes = derived(
        view.viewStore,
        (state) => state.document.selectedNodes,
    );

    $: {
        if ($mode && !$subgridTheme) {
            view.viewStore.dispatch({
                type: 'view/mandala/subgrid/enter',
                payload: { theme: '1' },
            });
        }

        if ($mode !== '9x9') {
            if (view.mandalaActiveCell9x9) {
                setActiveCell9x9(view, null);
            }
        } else {
            const section = $idToSection[$activeNodeId];
            const baseTheme = getBaseTheme(section);
            if (!section) {
                if (view.mandalaActiveCell9x9) {
                    setActiveCell9x9(view, null);
                }
            } else {
                const cell = view.mandalaActiveCell9x9;
                const pos = posOfSection9x9(
                    section,
                    $gridOrientation,
                    baseTheme,
                );
                if (cell) {
                    const mapped = sectionAtCell9x9(
                        cell.row,
                        cell.col,
                        $gridOrientation,
                        baseTheme,
                    );
                    if (!mapped || mapped !== section) {
                        setActiveCell9x9(view, pos ?? null);
                    }
                }
            }
        }
    }

    $: {
        const dayPlan = parseDayPlanFrontmatter($documentState.file.frontmatter);
        const allowSubgridExpansion =
            !(dayPlan && dayPlan.daily_only_3x3 && $subgridTheme?.includes('.'));
        if (
            allowSubgridExpansion &&
            $mode === '3x3' &&
            $subgridTheme &&
            !$subgridTheme.includes('.') &&
            $documentState.meta.isMandala
        ) {
            const themeNodeId = $sectionToNodeId[$subgridTheme];
            if (themeNodeId) {
                const childGroup = findChildGroup(
                    $documentState.document.columns,
                    themeNodeId,
                );
                const childCount = childGroup?.nodes.length ?? 0;
                if (childCount < 8) {
                    view.documentStore.dispatch({
                        type: 'document/mandala/ensure-children',
                        payload: { parentNodeId: themeNodeId, count: 8 },
                    });
                }
            }
        }
    }
    // 手机端全屏编辑状态判断
    $: isMobilePopupEditing = Platform.isMobile && $editingState.activeNodeId && !$editingState.isInSidebar;
    $: isMobileFullScreenSearch = Platform.isMobile && $search.showInput;

    let showSettings = false;
    const toggleSettings = () => {
        showSettings = !showSettings;
    };

    const handleSave = () => {
        if ($editingState.activeNodeId) {
            view.inlineEditor.unloadNode($editingState.activeNodeId, false);
            view.viewStore.dispatch({
                type: 'view/editor/disable-main-editor',
            });
        }
    };

    const handleIncreaseFontSize = () => {
        mobilePopupFontSizeStore.setFontSize($mobilePopupFontSizeStore + 1);
    };

    const handleDecreaseFontSize = () => {
        mobilePopupFontSizeStore.setFontSize($mobilePopupFontSizeStore - 1);
    };

    const enterSubgridFromButton = (event: MouseEvent, nodeId: string) => {
        event.stopPropagation();
        enterSubgridForNode(view, nodeId);
    };

    const exitSubgridFromButton = (event: MouseEvent) => {
        event.stopPropagation();
        exitCurrentSubgrid(view);
    };

    const getUpButtonLabel = (theme: string) =>
        theme.includes('.') ? '退出上一层子九宫格' : '上一层核心九宫格';

    const getDownButtonLabel = (theme: string) =>
        theme.includes('.') ? '进入下一层子九宫格' : '下一层核心九宫格';

</script>

<div
    class="mandala-root"
    class:mandala-root--3={$mode === '3x3'}
    class:mandala-root--9={$mode === '9x9'}
    class:is-editing-mobile={isMobilePopupEditing}
    class:is-square-layout={Platform.isMobile && $showDetailSidebar}
    class:is-desktop-square-layout={!Platform.isMobile && $squareLayout}
    class:has-detail-sidebar={!Platform.isMobile && $showDetailSidebar}
    class:is-portrait={isPortrait}
    class:mandala-white-theme={$whiteThemeMode}
    class:mandala-a4-mode={$a4Mode}
    class:mandala-a4-landscape={$a4Mode && $a4Orientation === 'landscape'}
    style="--mandala-square-size: {squareSize}px; --desktop-square-size: {desktopSquareSize}px; --mandala-border-opacity: {$borderOpacity}%;"
>
    {#if isMobilePopupEditing}
        <div class="mobile-edit-header">
            <button class="header-btn settings-btn" on:click|stopPropagation={toggleSettings} aria-label="设置">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
                </svg>
            </button>
            <div class="mobile-edit-title">编辑格子</div>
            <button class="header-btn save-btn" on:click|stopPropagation={handleSave}>保存</button>
        </div>
        <div class="mobile-popup-editor-container">
            {#if showSettings}
                <div class="mobile-settings-panel" on:click|stopPropagation>
                    <div class="settings-row">
                        <span class="settings-label">字号</span>
                        <div class="font-size-controls">
                            <button class="control-btn" on:click|stopPropagation={handleDecreaseFontSize}>-</button>
                            <span class="font-value">{$mobilePopupFontSizeStore}px</span>
                            <button class="control-btn" on:click|stopPropagation={handleIncreaseFontSize}>+</button>
                        </div>
                    </div>
                </div>
            {/if}
            <div class="mobile-popup-editor-body">
                <InlineEditor
                    nodeId={$editingState.activeNodeId}
                    style={$nodeStyles.get($editingState.activeNodeId)}
                    absoluteFontSize={$mobilePopupFontSizeStore}
                />
            </div>
        </div>
    {:else if isMobileFullScreenSearch}
        <MobileFullScreenSearch />
    {:else}
        <div class="mandala-topbar">
            <div class="mandala-topbar__left">
                <Toolbar />
            </div>
            <div class="mandala-topbar__center">
                <ToolbarCenter />
            </div>
            <div class="mandala-topbar__right">
                <VerticalToolbar />
            </div>
        </div>
        <div class="mandala-content-wrapper" bind:this={contentWrapperRef}>
            <div
                class="mandala-scroll"
                bind:this={containerRef}
                tabindex="0"
                on:click={() => focusContainer(view)}
            >
                {#if $mode === '3x3'}
                    {@const theme = $subgridTheme ?? '1'}
                    {@const layout = getMandalaLayout($gridOrientation)}
                    {@const sections = layout.childSlots.map((slot) =>
                        slot ? `${theme}.${slot}` : theme,
                    )}
                    {@const cells = sections.map((section, index) => {
                        const nodeId = requireNodeId(section);
                        return {
                            section,
                            index,
                            nodeId,
                            key: nodeId ?? `empty-${section}`,
                        };
                    })}
                    <div class="mandala-grid mandala-grid--3 mandala-grid--core">
                        {#each cells as cell (cell.key)}
                            {@const sectionBackground = getSectionBackground(
                                cell.section,
                                cell.index,
                                $backgroundMode,
                                $sectionColors,
                                $sectionColorOpacity,
                            )}
                            <div
                                class="mandala-cell"
                                animate:flip={{ duration: $swapState.animate ? 220 : 0 }}
                            >
                                {#if cell.nodeId}
                                    <MandalaCard
                                        nodeId={cell.nodeId}
                                        section={cell.section}
                                        active={cell.nodeId === $activeNodeId}
                                        editing={$editingState.activeNodeId ===
                                            cell.nodeId &&
                                            !$editingState.isInSidebar &&
                                            !$showDetailSidebar}
                                        selected={$selectedNodes.has(
                                            cell.nodeId,
                                        )}
                                        pinned={$pinnedNodes.has(cell.nodeId)}
                                        style={$nodeStyles.get(cell.nodeId)}
                                        sectionColor={sectionBackground}
                                        draggable={cell.section !== theme}
                                    />
                                    {#if !Platform.isMobile &&
                                        $show3x3SubgridNavButtons &&
                                        !$hasOpenOverlayModal}
                                        <div
                                            class="mandala-subgrid-controls"
                                            class:is-center-controls={cell.section === theme}
                                            on:click|stopPropagation
                                            on:mousedown|stopPropagation|preventDefault
                                            on:pointerdown|stopPropagation|preventDefault
                                        >
                                            {#if cell.section === theme}
                                                {#if theme !== '1'}
                                                    <button
                                                        class="mandala-subgrid-btn mandala-subgrid-btn--up"
                                                        type="button"
                                                        aria-label={getUpButtonLabel(theme)}
                                                        title={getUpButtonLabel(theme)}
                                                        on:click={(event) =>
                                                            exitSubgridFromButton(event)}
                                                    >
                                                        <span class="mandala-subgrid-btn__icon">
                                                            {#if theme.includes('.')}
                                                                <MandalaNavIcon
                                                                    direction="up"
                                                                    size={14}
                                                                    strokeWidth={2.2}
                                                                />
                                                            {:else}
                                                                <MandalaNavIcon
                                                                    direction="left"
                                                                    size={14}
                                                                    strokeWidth={2.2}
                                                                />
                                                            {/if}
                                                        </span>
                                                    </button>
                                                {/if}
                                                {#if !theme.includes('.')}
                                                    <button
                                                        class="mandala-subgrid-btn mandala-subgrid-btn--down"
                                                        type="button"
                                                        aria-label={getDownButtonLabel(theme)}
                                                        title={getDownButtonLabel(theme)}
                                                        on:click={(event) =>
                                                            enterSubgridFromButton(event, cell.nodeId)}
                                                    >
                                                        <span class="mandala-subgrid-btn__icon">
                                                            {#if theme.includes('.')}
                                                                <MandalaNavIcon
                                                                    direction="down"
                                                                    size={14}
                                                                    strokeWidth={2.2}
                                                                />
                                                            {:else}
                                                                <MandalaNavIcon
                                                                    direction="right"
                                                                    size={14}
                                                                    strokeWidth={2.2}
                                                                />
                                                            {/if}
                                                        </span>
                                                    </button>
                                                {/if}
                                            {:else}
                                                <button
                                                    class="mandala-subgrid-btn mandala-subgrid-btn--single"
                                                    type="button"
                                                    aria-label="进入子九宫"
                                                    on:click={(event) =>
                                                        enterSubgridFromButton(event, cell.nodeId)}
                                                >
                                                    <span class="mandala-subgrid-btn__icon">
                                                        <MandalaNavIcon
                                                            direction="down"
                                                            size={14}
                                                            strokeWidth={2.2}
                                                        />
                                                    </span>
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
                                {:else}
                                    <div
                                        class="mandala-empty"
                                        style={sectionBackground
                                            ? `background-color: ${sectionBackground};`
                                            : undefined}
                                    >
                                        {cell.section}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {:else}
                    <MandalaOverviewSimple />
                {/if}
            </div>

            <MandalaDetailSidebar />
        </div>
    {/if}
</div>

<style>
    .mandala-root {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        overflow: hidden;
        overscroll-behavior: contain;
        --mandala-core-gap: clamp(10px, 1vw, 18px);
        --mandala-gap: var(--node-gap-setting, calc(var(--mandala-core-gap) / 4));
        --mandala-block-gap: var(--mandala-gap);
        --mandala-card-width: 100%;
        --mandala-gray-block-base: color-mix(
            in srgb,
            var(--background-modifier-border) 70%,
            var(--background-primary)
        );
        --mandala-border-opacity: 100%;
        --mandala-border-color: color-mix(
            in srgb,
            var(--text-normal) var(--mandala-border-opacity),
            transparent
        );
        --mandala-a4-width: 210mm;
        --mandala-a4-height: 297mm;
        --mandala-a4-margin: 1.27cm;
    }

    .mandala-topbar {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        padding: 4px var(--size-4-2);
        border-bottom: 1px solid var(--background-modifier-border);
        flex: 0 0 auto;
        position: relative;
        z-index: 1000;
        pointer-events: none;
    }
    .mandala-topbar :global(> *) {
        pointer-events: auto;
    }

    .mandala-topbar__left,
    .mandala-topbar__center,
    .mandala-topbar__right {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        min-width: 0;
    }
    .mandala-topbar__left {
        justify-self: start;
    }
    .mandala-topbar__center {
        justify-self: center;
        overflow: hidden;
    }
    .mandala-topbar__right {
        justify-self: end;
    }

    .mandala-scroll {
        flex: 1 1 auto;
        overflow: auto;
        padding: 12px;
    }

    
    /* 桌面端调整格子右侧间距为 6px，为 6+6=12px 做准备 */
    :global(body:not(.is-mobile)) .mandala-root:not(.mandala-a4-mode) .mandala-scroll {
        padding: 12px 6px 12px 12px;
    }

    .mandala-content-wrapper {
        flex: 1 1 auto;
        display: flex;
        flex-direction: row;
        min-height: 0;
        overflow: hidden;
    }

    /* 桌面端正方形布局 + 无侧边栏时居中 */
    .is-desktop-square-layout:not(.has-detail-sidebar) .mandala-content-wrapper {
        justify-content: center;
    }

    /* 移动端正方形优先布局 */
    .is-square-layout .mandala-content-wrapper {
        flex-direction: row; /* 横排 */
    }
    .is-square-layout.is-portrait .mandala-content-wrapper {
        flex-direction: column; /* 竖排 */
    }

    /* 锁定网格为正方形 */
    .is-square-layout .mandala-scroll {
        flex: 0 0 auto;
        width: var(--mandala-square-size);
        height: 100%;
        padding: 12px;
    }

    .is-square-layout.is-portrait .mandala-scroll {
        width: 100%;
        height: var(--mandala-square-size);
    }

    /* 竖屏模式：纵向堆叠 */
    .is-portrait .mandala-content-wrapper {
        flex-direction: column;
    }

    /* 桌面端正方形布局 */
    .is-desktop-square-layout .mandala-scroll {
        flex: 0 0 auto;
        width: var(--desktop-square-size);
        height: var(--desktop-square-size);
        overflow: auto;
        align-self: center;
    }

    .mandala-a4-mode .mandala-content-wrapper {
        justify-content: center;
        overflow: auto;
        align-items: flex-start;
    }

    .mandala-a4-mode .mandala-scroll {
        flex: 0 0 auto;
        width: var(--mandala-a4-width);
        height: var(--mandala-a4-height);
        overflow: hidden;
        align-self: flex-start;
        margin: 0 auto;
        padding: var(--mandala-a4-margin);
        box-sizing: border-box;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        position: relative;
    }

    .mandala-a4-mode.mandala-a4-landscape .mandala-scroll {
        width: var(--mandala-a4-height);
        height: var(--mandala-a4-width);
    }

    .mandala-a4-mode {
        --mandala-a4-content-width: calc(
            var(--mandala-a4-width) - (2 * var(--mandala-a4-margin))
        );
        --mandala-a4-content-height: calc(
            var(--mandala-a4-height) - (2 * var(--mandala-a4-margin))
        );
    }

    .mandala-a4-mode.mandala-a4-landscape {
        --mandala-a4-content-width: calc(
            var(--mandala-a4-height) - (2 * var(--mandala-a4-margin))
        );
        --mandala-a4-content-height: calc(
            var(--mandala-a4-width) - (2 * var(--mandala-a4-margin))
        );
    }

    .mandala-a4-mode.is-desktop-square-layout .mandala-scroll {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .mandala-a4-mode.is-desktop-square-layout .mandala-grid--core {
        width: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
        height: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
    }

    .mandala-a4-mode.is-desktop-square-layout :global(.simple-9x9-grid) {
        width: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
        height: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
    }

    .mandala-a4-mode.is-desktop-square-layout :global(.simple-9x9-shell) {
        display: flex;
        align-items: center;
        justify-content: center;
        width: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
        height: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
    }

    /* A4 视觉校对：外框与内容区边界 */
    .mandala-a4-mode .mandala-scroll::before,
    .mandala-a4-mode .mandala-scroll::after {
        display: none;
    }

    .mandala-a4-mode .mandala-scroll::before {
        content: '';
        position: absolute;
        inset: 0;
        outline: 1px solid rgba(255, 0, 0, 0.6);
        pointer-events: none;
        box-sizing: border-box;
    }

    .mandala-a4-mode .mandala-scroll::after {
        content: '';
        position: absolute;
        inset: var(--mandala-a4-margin);
        outline: 1px dashed rgba(0, 128, 255, 0.8);
        pointer-events: none;
        box-sizing: border-box;
    }
    .mandala-grid {
        display: grid;
        grid-template-columns: repeat(3, var(--node-width));
        gap: var(--mandala-gap);
        align-items: start;
    }

    .mandala-cell {
        width: 100%;
        height: 100%;
        position: relative;
    }

    /* 3×3 主视图：铺满可视区域（避免横向滚动） */
    .mandala-grid--core {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        align-items: stretch;
        justify-items: stretch;
    }

    .mandala-white-theme .mandala-grid--core {
        gap: 0;
        box-sizing: border-box;
    }

    .mandala-white-theme .mandala-cell {
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        box-sizing: border-box;
        overflow: hidden;
    }

    .mandala-white-theme .mandala-cell:nth-child(-n + 3) {
        border-top: 3px solid var(--mandala-border-color);
    }

    .mandala-white-theme .mandala-cell:nth-child(3n + 1) {
        border-left: 3px solid var(--mandala-border-color);
    }

    .mandala-white-theme .mandala-cell:nth-child(n + 7) {
        border-bottom: 3px solid var(--mandala-border-color);
    }

    .mandala-white-theme .mandala-cell:nth-child(3n) {
        border-right: 3px solid var(--mandala-border-color);
    }

    .mandala-white-theme .mandala-cell :global(.mandala-card) {
        border: 0 !important;
        border-left-width: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
    }

    .mandala-a4-mode.mandala-root--3:not(.mandala-white-theme)
        :global(.mandala-card) {
        border: 1px solid var(--text-normal) !important;
        border-left-width: 1px !important;
        border-radius: 0 !important;
        box-shadow: none !important;
    }

    .mandala-a4-mode.mandala-root--3 :global(.mandala-card.active-node),
    .mandala-white-theme.mandala-root--3 :global(.mandala-card.active-node) {
        position: relative;
    }

    .mandala-a4-mode.mandala-root--3 :global(.mandala-card.active-node)::after,
    .mandala-white-theme.mandala-root--3
        :global(.mandala-card.active-node)::after {
        content: '';
        position: absolute;
        inset: 2px;
        border: 2px solid var(--mandala-color-selection);
        pointer-events: none;
        box-sizing: border-box;
        border-radius: 0;
    }

    .mandala-root--3 {
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--3 .mandala-empty {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .mandala-subgrid-controls {
        position: absolute;
        right: 8px;
        bottom: 8px;
        z-index: 20;
        display: flex;
        gap: 6px;
        pointer-events: auto;
    }

    .mandala-subgrid-controls.is-center-controls {
        left: 8px;
        right: 8px;
        bottom: 8px;
        display: block;
    }

    .mandala-subgrid-btn {
        width: 24px;
        height: 24px;
        border-radius: 999px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        box-shadow: var(--shadow-s);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        position: relative;
        z-index: 21;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            box-shadow 120ms ease,
            transform 120ms ease;
    }

    .mandala-subgrid-btn:hover {
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
        transform: translateY(-1px);
    }

    .mandala-subgrid-btn:active {
        transform: translateY(1px);
    }

    .mandala-subgrid-btn__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        line-height: 0;
    }

    .mandala-subgrid-btn__icon :global(svg),
    .mandala-subgrid-btn__icon :global(.svg-icon) {
        display: block;
        width: 14px !important;
        height: 14px !important;
        stroke-width: 2.2 !important;
    }

    .mandala-subgrid-controls.is-center-controls
        .mandala-subgrid-btn--up {
        position: absolute;
        left: 0;
        bottom: 0;
    }

    .mandala-subgrid-controls.is-center-controls
        .mandala-subgrid-btn--down {
        position: absolute;
        right: 0;
        bottom: 0;
    }

    /* 9×9：格子约等于 3×3 的 1/3，并铺满屏幕 */
    .mandala-root--9 {
        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--9 .mandala-grid {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        align-items: stretch;
    }

    .mandala-root--9 .mandala-empty {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .mandala-root--9 :global(.lng-prev) {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
        overflow: auto;
    }

    .mandala-root--9 :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    .mandala-root--9 :global(.draggable),
    .mandala-root--9 :global(.draggable .content) {
        height: 100%;
    }

    /* 3×3：内容超出时在格子内部滚动（避免撑开格子） */
    .mandala-root--3 :global(.lng-prev) {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
        overflow: auto;
    }

    .mandala-root--3 :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    .mandala-root--3 :global(.draggable),
    .mandala-root--3 :global(.draggable .content) {
        height: 100%;
    }

    .mandala-empty {
        width: var(--node-width);
        min-height: var(--min-node-height);
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        padding: 8px;
        opacity: 0.7;
        position: relative;
        background: var(--background-primary);
    }

    .is-editing-mobile.mandala-root {
        height: 100dvh !important;
        overflow: hidden !important;
    }

    /* 移动端全屏编辑器样式 */
    .mobile-popup-editor-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100dvh;
        background-color: var(--background-primary);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding-top: calc(env(safe-area-inset-top, 20px) + 50px);
    }

    .mobile-popup-editor-body {
        padding: 16px;
        flex: 1;
        background-color: var(--background-primary);
    }

    .mobile-edit-header {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: calc(env(safe-area-inset-top, 20px) + 50px);
        background-color: var(--background-primary-alt);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--background-modifier-border);
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: 0 16px 12px 16px;
        z-index: 1001;
        pointer-events: auto;
    }

    .mobile-edit-title {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        font-weight: 600;
        font-size: 16px;
        color: var(--text-normal);
        pointer-events: none;
    }

    .header-btn {
        background: none;
        border: none;
        padding: 4px 8px;
        font-size: 16px;
        cursor: pointer;
        box-shadow: none !important;
        color: var(--interactive-accent);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
    }

    .header-btn:active {
        background-color: var(--background-modifier-hover);
    }

    .save-btn {
        font-weight: 600;
        color: var(--text-accent);
    }

    .settings-btn {
        opacity: 0.8;
        color: var(--text-muted);
    }
    .settings-btn:active {
        opacity: 1;
        color: var(--text-normal);
    }

    /* 设置面板 */
    .mobile-settings-panel {
        position: fixed;
        top: calc(env(safe-area-inset-top, 20px) + 50px);
        left: 0;
        width: 100%;
        background: var(--background-secondary);
        border-bottom: 1px solid var(--background-modifier-border);
        padding: 16px;
        z-index: 1002;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
        from { transform: translateY(-10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .settings-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .settings-label {
        font-size: 15px;
        color: var(--text-normal);
    }

    .font-size-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .control-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        font-size: 18px;
        color: var(--text-normal);
        cursor: pointer;
    }

    .font-value {
        min-width: 40px;
        text-align: center;
        font-size: 14px;
        color: var(--text-muted);
    }

    /* 全屏下隐藏一些卡片特有装饰 */
    .mobile-popup-editor-body :global(.mandala-section-label) {
        display: none;
    }
</style>
