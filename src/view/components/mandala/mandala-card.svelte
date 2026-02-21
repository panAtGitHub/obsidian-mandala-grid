<script lang="ts">
    import clx from 'classnames';
    import { ActiveStatus } from 'src/view/components/container/column/components/group/components/active-status.enum';
    import Content from 'src/view/components/container/column/components/group/components/card/components/content/content.svelte';
    import InlineEditor from 'src/view/components/container/column/components/group/components/card/components/content/inline-editor.svelte';
    import Draggable from 'src/view/components/container/column/components/group/components/card/components/dnd/draggable.svelte';
    import CardStyle from 'src/view/components/container/column/components/group/components/card/components/card-style.svelte';
    import { droppable } from 'src/view/actions/dnd/droppable';
    import { NodeStyle } from 'src/stores/settings/types/style-rules-types';
    import { getView } from 'src/view/components/container/context';
    import { setActiveMainSplitNode } from 'src/view/components/container/column/components/group/components/card/components/content/store-actions/set-active-main-split-node';
    import { enableEditModeInMainSplit } from 'src/view/components/container/column/components/group/components/card/components/content/store-actions/enable-edit-mode-in-main-split';
    import { Platform } from 'obsidian';
    import {
        enterSubgridForNode,
        exitCurrentSubgrid,
        isGridCenter,
    } from 'src/view/helpers/mandala/mobile-navigation';
    import {
        executeMandalaSwap,
        handleMandalaSwapNodeClick,
        shouldBlockMandalaNodeDoubleClickForSwap,
    } from 'src/view/helpers/mandala/mandala-swap';
    import { setActiveCell9x9 } from 'src/view/helpers/mandala/set-active-cell-9x9';
    import { enableSidebarEditorForNode } from 'src/view/helpers/mandala/node-editing';
    import { ShowMandalaDetailSidebarStore } from 'src/stores/settings/derived/view-settings-store';
    import { derived } from 'src/lib/store/derived';
    import { localFontStore } from 'src/stores/local-font-store';
    import {
        getReadableTextTone,
        type ThemeTone,
        type TextTone,
    } from 'src/view/helpers/mandala/contrast-text-tone';

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
    export let draggable: boolean;
    export let forceActiveBackground = false;
    export let gridCell: { mode: '9x9'; row: number; col: number } | null =
        null;

    const view = getView();
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const swapState = derived(view.viewStore, (state) => state.ui.mandala.swap);
    const idToSection = derived(
        view.documentStore,
        (state) => state.sections.id_section,
    );
    const getThemeTone = (): ThemeTone =>
        document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    const getThemeUnderlayColor = () =>
        window
            .getComputedStyle(document.body)
            .getPropertyValue('--background-primary')
            .trim();
    let contrastBackgroundColor: string | null = null;
    let textTone: TextTone | null = null;
    let cardStyle: string | undefined;
    let displaySection = section;
    let shouldForceActiveBackground = false;

    $: shouldForceActiveBackground = forceActiveBackground && active;
    $: contrastBackgroundColor = sectionColor
        ? shouldForceActiveBackground
            ? null
            : sectionColor
        : !shouldForceActiveBackground &&
            style?.styleVariant === 'background-color'
          ? style.color
          : null;
    $: displaySection = $idToSection[nodeId] ?? section;
    $: textTone = getReadableTextTone(
        contrastBackgroundColor,
        getThemeTone(),
        getThemeUnderlayColor(),
    );
    $: cardStyle = [
        shouldForceActiveBackground
            ? 'background-color: var(--background-active-node) !important'
            : sectionColor
              ? `background-color: ${sectionColor}`
              : '',
        !shouldForceActiveBackground && textTone === 'dark'
            ? '--text-normal: #0f131a; --text-muted: #2f3a48; --text-faint: #4f5c6b'
            : '',
        !shouldForceActiveBackground && textTone === 'light'
            ? '--text-normal: #f3f6fd; --text-muted: #d0d8e6; --text-faint: #b0bbce'
            : '',
    ]
        .filter((chunk) => chunk.length > 0)
        .join('; ');
    $: cardStyle = cardStyle.length > 0 ? cardStyle : undefined;

    const handleSelect = (e: MouseEvent) => {
        if (gridCell) {
            setActiveCell9x9(view, null);
        }
        setActiveMainSplitNode(view, nodeId, e);

        // 移动端：绝对禁止触发编辑逻辑（编辑由右侧栏双击触发）
        if (isMobile) {
            return;
        }

        const maintainEditMode =
            view.plugin.settings.getValue().view.maintainEditMode;
        if (maintainEditMode && $showDetailSidebar) {
            enableSidebarEditorForNode(view, nodeId);
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
    use:droppable
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
    {#if style &&
        !((sectionColor || shouldForceActiveBackground) &&
            style.styleVariant === 'background-color')}
        <CardStyle {style} />
    {/if}

    {#if active && editing && !$showDetailSidebar}
        <InlineEditor
            {nodeId}
            {style}
            fontSizeOffset={isMobile ? $localFontStore - 16 : 0}
            absoluteFontSize={isMobile ? $localFontStore : undefined}
        />
    {:else if draggable}
        <Draggable {nodeId} isInSidebar={false} dragActivation="whole-card">
            <Content
                {nodeId}
                isInSidebar={false}
                active={active ? ActiveStatus.node : null}
            />
        </Draggable>
    {:else}
        <Content
            {nodeId}
            isInSidebar={false}
            active={active ? ActiveStatus.node : null}
        />
    {/if}

    <div class="mandala-section-label">{displaySection}</div>
</div>

<style>
    .mandala-card {
        width: var(--mandala-card-width, var(--node-width));
        min-height: var(--mandala-card-min-height, var(--min-node-height));
        height: var(--mandala-card-height, fit-content);
        display: flex;
        flex-direction: column;
        position: relative;
        --font-text-size: var(--mandala-font-3x3, 16px);
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

    .mandala-section-label {
        position: absolute;
        top: 6px;
        right: 8px;
        font-size: 12px;
        opacity: 0.7;
        user-select: none;
        pointer-events: none;
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
