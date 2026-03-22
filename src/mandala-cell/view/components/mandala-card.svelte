<script lang="ts">
    import clx from 'classnames';
    import CardMainContent from 'src/mandala-cell/view/components/card-main-content.svelte';
    import CardMeta from 'src/mandala-cell/view/components/card-meta.svelte';
    import CardStyle from 'src/mandala-cell/view/style/card-style.svelte';
    import { buildMandalaCardRenderModel } from 'src/mandala-cell/model/build-mandala-card-render-model';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { Platform } from 'obsidian';
    import { ShowMandalaDetailSidebarStore } from 'src/mandala-settings/state/derived/view-settings-store';
    import { derived } from 'src/shared/store/derived';
    import { localFontStore } from 'src/stores/local-font-store';
    import { type ThemeTone } from 'src/mandala-interaction/helpers/contrast-text-tone';
    import {
        DEFAULT_CELL_SCROLLBAR_MODE,
        type CellScrollbarMode,
    } from 'src/mandala-cell/model/cell-scrollbar-mode';
    import type { MandalaCardRenderModel } from 'src/mandala-cell/model/card-render-model';
    import type { MandalaCardViewModel } from 'src/mandala-cell/model/card-view-model';
    import {
        clickMandalaCard,
        doubleClickMandalaCard,
    } from 'src/mandala-cell/viewmodel/controller/mandala-card-controller';
    import {
        handleSwapPointerStart,
        isSwapDisabledNode,
        isSwapSourceNode,
        isSwapTargetNode,
        shouldBlockSwapDoubleClick,
    } from 'src/mandala-cell/viewmodel/controller/swap-controller';

    // 缓存平台状态，避免每次渲染都读取
    const isMobile = Platform.isMobile;

    export let viewModel: MandalaCardViewModel;
    export let scrollbarMode: CellScrollbarMode = DEFAULT_CELL_SCROLLBAR_MODE;

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
    let renderModel: MandalaCardRenderModel;
    let nodeId: string;
    let section: string;
    let active: boolean;
    let editing: boolean;
    let selected: boolean;
    let pinned: boolean;
    let nodeStyle = viewModel.style;
    let sectionColor: string | null = null;
    let metaAccentColor: string | null = null;
    let displayPolicy = viewModel.displayPolicy;
    let interactionPolicy = viewModel.interactionPolicy;
    let gridCell = viewModel.gridCell;
    let fillContent = false;

    $: ({
        nodeId,
        section,
        active,
        editing,
        selected,
        pinned,
        style: nodeStyle,
        sectionColor,
        metaAccentColor,
        displayPolicy,
        interactionPolicy,
        gridCell,
    } = viewModel);
    $: fillContent = displayPolicy.contentLayout === 'fill';

    $: renderModel = buildMandalaCardRenderModel({
        nodeId,
        section,
        fallbackSection: $idToSection[nodeId],
        active,
        editing,
        pinned,
        style: nodeStyle,
        sectionColor,
        metaAccentColor,
        displayPolicy,
        previewDialogOpen: $previewDialog.open,
        previewDialogNodeId: $previewDialog.nodeId,
        showDetailSidebar: $showDetailSidebar,
        isMobile,
        themeTone: getThemeTone(),
        themeUnderlayColor: getThemeUnderlayColor(),
    });

    const handleCardMouseDown = (e: MouseEvent) => {
        handleSwapPointerStart({
            view,
            swapState: $swapState,
            nodeId,
            event: e,
        });
    };

    const handleCardTouchStart = (e: TouchEvent) => {
        handleSwapPointerStart({
            view,
            swapState: $swapState,
            nodeId,
            event: e,
        });
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
    class:mandala-card--swap-source={isSwapSourceNode($swapState, nodeId)}
    class:mandala-card--swap-target={isSwapTargetNode($swapState, nodeId)}
    class:mandala-card--swap-disabled={isSwapDisabledNode($swapState, nodeId)}
    class:is-floating-mobile={renderModel.isFloatingMobile}
    id={nodeId}
    style={renderModel.cardStyle}
    on:mousedown={handleCardMouseDown}
    on:touchstart={handleCardTouchStart}
    on:click={(e) =>
        clickMandalaCard({
            view,
            nodeId,
            gridCell,
            isMobile,
            swapActive: $swapState.active,
            event: e,
        })}
    on:dblclick={(e) => {
        if (shouldBlockSwapDoubleClick($swapState)) return;
        doubleClickMandalaCard({
            view,
            nodeId,
            displaySection: renderModel.displaySection,
            gridCell,
            interactionPolicy,
            isMobile,
            showDetailSidebar: $showDetailSidebar,
            event: e,
        });
    }}
>
    {#if nodeStyle &&
    !(renderModel.shouldHideBackgroundStyle &&
        nodeStyle.styleVariant === 'background-color')}
        <CardStyle style={nodeStyle} />
    {/if}

    <CardMainContent
        {nodeId}
        style={nodeStyle}
        isInSidebar={false}
        showInlineEditor={renderModel.showInlineEditor}
        showContent={renderModel.showContent}
        hideBuiltInHiddenInfo={renderModel.hideBuiltInHiddenInfo}
        fontSizeOffset={isMobile ? $localFontStore - 16 : 0}
        absoluteFontSize={isMobile ? $localFontStore : undefined}
        {scrollbarMode}
        {fillContent}
    />

    <CardMeta
        displaySection={renderModel.displaySection}
        showSectionBackground={renderModel.showSectionBackground}
        showSectionPin={renderModel.showSectionPin}
        showSectionColorDot={renderModel.showSectionColorDot}
        capsuleTextTone={renderModel.capsuleTextTone}
        metaStyle={renderModel.metaStyle}
    />
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
