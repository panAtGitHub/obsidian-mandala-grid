<script lang="ts">
    import clx from 'classnames';
    import { Pin } from 'lucide-svelte';
    import Content from 'src/cell/display/content/content.svelte';
    import InlineEditor from 'src/cell/display/content/inline-editor.svelte';
    import {
        buildMandalaCardMetaState,
        type SectionIndicatorVariant,
    } from 'src/cell/display/meta/mandala-card-meta';
    import type { CellGridPosition } from 'src/cell/model/card-types';
    import CardStyle from 'src/cell/display/style/card-style.svelte';
    import { buildMandalaCardStyle } from 'src/cell/display/style/mandala-card-style';
    import { enableEditModeInMainSplit } from 'src/cell/interaction/actions/enable-edit-mode-in-main-split';
    import { setActiveMainSplitNode } from 'src/cell/interaction/actions/set-active-main-split-node';
    import { NodeStyle } from 'src/stores/settings/types/style-rules-types';
    import { getView } from 'src/views/shared/shell/context';
    import { Platform } from 'obsidian';
    import {
        enterSubgridForNode,
        exitCurrentSubgrid,
        isGridCenter,
    } from 'src/helpers/views/mandala/mobile-navigation';
    import {
        executeMandalaSwap,
        handleMandalaSwapNodeClick,
        shouldBlockMandalaNodeDoubleClickForSwap,
    } from 'src/view/helpers/mandala/mandala-swap';
    import { setActiveCell9x9 } from 'src/helpers/views/mandala/set-active-cell-9x9';
    import { setActiveCellNx9 } from 'src/view/helpers/mandala/nx9/set-active-cell';
    import { setActiveCellWeek7x9 } from 'src/helpers/views/mandala/set-active-cell-week-7x9';
    import { enableSidebarEditorForNode } from 'src/helpers/views/mandala/node-editing';
    import { isPreviewDialogEditingNode } from 'src/helpers/views/mandala/is-preview-dialog-editing-node';
    import { ShowMandalaDetailSidebarStore } from 'src/stores/settings/derived/view-settings-store';
    import { derived } from 'src/lib/store/derived';
    import { localFontStore } from 'src/stores/local-font-store';
    import { type ThemeTone } from 'src/view/helpers/mandala/contrast-text-tone';

    // 缓存平台状态，避免每次渲染都读取
    const isMobile = Platform.isMobile;

    export let nodeId: string;
    export let section: string;
    export let active: boolean;
    export let editing: boolean;
    export let selected: boolean;
    export let pinned: boolean;
    export let style: NodeStyle | undefined;
    export let sectionColor: string | null = null;
    export let preserveActiveBackground = false;
    export let sectionIndicatorVariant: SectionIndicatorVariant = 'plain';
    export let gridCell: CellGridPosition | null = null;

    const view = getView();
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const swapState = derived(view.viewStore, (state) => state.ui.mandala.swap);
    const previewDialog = derived(
        view.viewStore,
        (state) => state.ui.previewDialog,
    );
    const idToSection = derived(
        view.documentStore,
        (state) => state.sections.id_section,
    );
    const getThemeTone = (): ThemeTone =>
        document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    const getThemeUnderlayColor = () =>
        window
            .getComputedStyle(document.body)
            .getPropertyValue(
                active
                    ? '--background-active-node'
                    : '--background-active-parent',
            )
            .trim();
    let cardStyle: string | undefined;
    let displaySection = section;
    let shouldHideBackgroundStyle = false;
    let showSectionBackground = false;
    let showSectionPin = false;
    let capsuleTextTone: 'dark' | 'light' | null = null;
    let metaStyle: string | undefined;

    $: displaySection = section || $idToSection[nodeId] || '';
    $: ({ cardStyle, shouldHideBackgroundStyle } = buildMandalaCardStyle({
        active,
        sectionColor,
        preserveActiveBackground,
        style,
        themeTone: getThemeTone(),
        themeUnderlayColor: getThemeUnderlayColor(),
    }));
    $: ({
        showBackground: showSectionBackground,
        showPin: showSectionPin,
        textTone: capsuleTextTone,
    } = buildMandalaCardMetaState({
        variant: sectionIndicatorVariant,
        sectionColor,
        pinned,
        themeTone: getThemeTone(),
        themeUnderlayColor: getThemeUnderlayColor(),
    }));
    $: metaStyle =
        showSectionBackground && sectionColor
            ? `--mandala-card-meta-bg: ${sectionColor}`
            : undefined;
    // Quick preview editing reuses the main editor state, but the editor
    // should render only inside the dialog instead of the background card.
    $: previewOwnsInlineEditor = isPreviewDialogEditingNode({
        previewDialogOpen: $previewDialog.open,
        previewDialogNodeId: $previewDialog.nodeId,
        editingActiveNodeId: editing ? nodeId : null,
        editingIsInSidebar: false,
        nodeId,
    });

    const handleSelect = (e: MouseEvent) => {
        if (gridCell) {
            if (gridCell.mode === 'week-7x9') {
                setActiveCellWeek7x9(view, {
                    row: gridCell.row,
                    col: gridCell.col,
                });
            } else if (gridCell.mode === 'nx9') {
                setActiveCellNx9(view, {
                    row: gridCell.row,
                    col: gridCell.col,
                    page: gridCell.page,
                });
            } else {
                setActiveCell9x9(view, {
                    row: gridCell.row,
                    col: gridCell.col,
                });
            }
        }
        setActiveMainSplitNode(view, nodeId, e);

        // 移动端：绝对禁止触发编辑逻辑（编辑由右侧栏双击触发）
        if (isMobile) {
            return;
        }
    };

    const handleCardClick = (e: MouseEvent) => {
        if ($swapState.active) {
            return;
        }

        handleSelect(e);
    };

    const handleCardMouseDown = (e: MouseEvent) => {
        if (
            handleMandalaSwapNodeClick($swapState, nodeId, (source, target) =>
                executeMandalaSwap(view, source, target),
            )
        ) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const handleCardTouchStart = (e: TouchEvent) => {
        if (
            handleMandalaSwapNodeClick($swapState, nodeId, (source, target) =>
                executeMandalaSwap(view, source, target),
            )
        ) {
            e.preventDefault();
            e.stopPropagation();
        }
    };
</script>

<div
    class={clx(
        'mandala-card',
        active ? 'active-node' : 'inactive-node',
        sectionColor ? 'mandala-card--with-section-color' : undefined,
        selected ? 'node-border--selected' : undefined,
        pinned ? 'node-border--pinned' : undefined,
        active ? 'node-border--active' : undefined,
    )}
    class:mandala-card--swap-source={$swapState.active &&
        $swapState.sourceNodeId === nodeId}
    class:mandala-card--swap-target={$swapState.active &&
        $swapState.targetNodeIds.has(nodeId)}
    class:mandala-card--swap-disabled={$swapState.active &&
        !$swapState.targetNodeIds.has(nodeId) &&
        $swapState.sourceNodeId !== nodeId}
    class:is-floating-mobile={isMobile && editing && !$showDetailSidebar}
    id={nodeId}
    style={cardStyle}
    on:mousedown={handleCardMouseDown}
    on:touchstart={handleCardTouchStart}
    on:click={handleCardClick}
    on:dblclick={(e) => {
        if (shouldBlockMandalaNodeDoubleClickForSwap($swapState)) return;

        // 移动端：双击仅用于导航（进入/退出子九宫）
        if (isMobile) {
            if (isGridCenter(view, nodeId, displaySection)) {
                exitCurrentSubgrid(view);
            } else {
                enterSubgridForNode(view, nodeId);
            }
            return;
        }

        handleSelect(e);

        // PC 端逻辑：根据侧栏状态决定编辑位置
        if ($showDetailSidebar) {
            enableSidebarEditorForNode(view, nodeId);
        } else {
            enableEditModeInMainSplit(view, nodeId);
        }
    }}
>
    {#if style && !(shouldHideBackgroundStyle && style.styleVariant === 'background-color')}
        <CardStyle {style} />
    {/if}

    {#if active && editing && !$showDetailSidebar && !previewOwnsInlineEditor}
        <InlineEditor
            {nodeId}
            {style}
            fontSizeOffset={isMobile ? $localFontStore - 16 : 0}
            absoluteFontSize={isMobile ? $localFontStore : undefined}
        />
    {:else}
        <Content {nodeId} isInSidebar={false} />
    {/if}

    <div
        class={clx(
            'mandala-card-meta',
            showSectionBackground
                ? 'mandala-card-meta--with-bg'
                : 'mandala-card-meta--without-bg',
            showSectionBackground && capsuleTextTone
                ? `mandala-card-meta--tone-${capsuleTextTone}`
                : undefined,
        )}
        style={metaStyle}
    >
        {#if showSectionPin}
            <span class="mandala-card-meta__pin" aria-hidden="true">
                <Pin size={10} strokeWidth={2.2} />
            </span>
        {/if}
        <span class="mandala-card-meta__section">{displaySection}</span>
    </div>
</div>

<style>
    .mandala-card {
        width: var(--mandala-card-width, var(--node-width));
        min-height: var(--mandala-card-min-height, var(--min-node-height));
        height: var(--mandala-card-height, fit-content);
        display: flex;
        flex-direction: column;
        position: relative;
        --font-text-size: var(
            --mandala-card-font-size,
            var(--mandala-font-3x3, 16px)
        );
        font-size: var(--font-text-size, 16px);
        line-height: 1.4;
        overflow: var(--mandala-card-overflow, visible);
        background-color: var(--background-primary);
        --scrollbar-thumb-bg: var(--color-base-30);
        --scrollbar-active-thumb-bg: var(--color-base-40);
    }

    :global(.mandala-view:not(.mandala-white-theme)) .mandala-card:hover {
        z-index: 10;
    }

    .mandala-card-meta {
        position: absolute;
        top: 6px;
        right: 8px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        user-select: none;
        pointer-events: none;
        z-index: 1;
    }

    .mandala-card-meta--with-bg {
        min-height: 18px;
        padding: 1px 6px;
        border-radius: 6px;
        background: var(--mandala-card-meta-bg);
        color: var(--text-muted);
    }

    .mandala-card-meta--without-bg {
        opacity: 0.7;
    }

    .mandala-card-meta__pin {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: currentColor;
        opacity: 0.9;
    }

    .mandala-card-meta__section {
        line-height: 1;
    }

    .mandala-card-meta--tone-dark {
        color: #2f3a48;
    }

    .mandala-card-meta--tone-light {
        color: #d0d8e6;
    }

    .mandala-card--swap-source {
        box-shadow: 0 0 0 2px var(--interactive-accent);
    }

    .mandala-card--swap-target {
        box-shadow: 0 0 0 2px var(--interactive-accent);
        cursor: pointer;
    }

    .mandala-card--swap-disabled {
        opacity: 0.6;
    }

    /* 悬浮模式下的内容区优化 (目前统一由顶层逻辑处理) */
</style>
