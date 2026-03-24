<script lang="ts">
    import clx from 'classnames';
    import { getCellRuntime } from 'src/view/context';
    import CardMainContent from 'src/mandala-cell/view/components/card-main-content.svelte';
    import CardMeta from 'src/mandala-cell/view/components/card-meta.svelte';
    import CardStyle from 'src/mandala-cell/view/style/card-style.svelte';
    import { buildMandalaCardRenderModel } from 'src/mandala-cell/model/build-mandala-card-render-model';
    import type { MandalaCardRenderModel } from 'src/mandala-cell/model/card-render-model';
    import type {
        MandalaCardUiState,
        MandalaCardViewModel,
        MandalaThemeSnapshot,
    } from 'src/mandala-cell/model/card-view-model';
    import {
        clickMandalaCard,
        doubleClickMandalaCard,
        type MandalaCardMobileDoubleClickHandler,
    } from 'src/mandala-cell/viewmodel/controller/mandala-card-controller';
    import {
        handleSwapPointerStart,
        isSwapDisabledNode,
        isSwapSourceNode,
        isSwapTargetNode,
        shouldBlockSwapDoubleClick,
    } from 'src/mandala-cell/viewmodel/controller/swap-controller';

    export let viewModel: MandalaCardViewModel;
    export let uiState: MandalaCardUiState;
    export let themeSnapshot: MandalaThemeSnapshot | undefined = undefined;
    export let onMobileDoubleClick: MandalaCardMobileDoubleClickHandler | null =
        null;

    const cellRuntime = getCellRuntime();
    const isMobile = cellRuntime.isMobilePlatform;
    const showDetailSidebar = cellRuntime.showDetailSidebar;
    const swapState = cellRuntime.swapState;
    const previewDialog = cellRuntime.previewDialog;
    const idToSection = cellRuntime.idToSection;
    const localFontSize = cellRuntime.localFontSize;
    const getThemeTone = () =>
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
    let nodeStyle = viewModel.style;
    let displayPolicy = viewModel.displayPolicy;
    let hasSectionColor = false;
    let active = false;
    let selected = false;
    let pinned = false;
    let fillContent = false;
    let contentDensity: 'normal' | 'compact' = 'normal';
    let scrollbarMode = displayPolicy.scrollbarMode;
    let hoverElevationEnabled = true;
    let detachInactiveSurface = false;
    let suppressHoverSurfaceEffect = false;

    $: ({
        nodeId,
        style: nodeStyle,
        displayPolicy,
    } = viewModel);
    $: ({ active, selected, pinned } = uiState);
    $: hasSectionColor = !!viewModel.sectionColor;
    $: fillContent = displayPolicy.contentLayout === 'fill';
    $: contentDensity = displayPolicy.density;
    $: scrollbarMode = displayPolicy.scrollbarMode;
    $: hoverElevationEnabled = displayPolicy.hoverBehavior === 'elevated';
    $: suppressHoverSurfaceEffect = displayPolicy.hoverBehavior === 'none';
    $: detachInactiveSurface =
        displayPolicy.inactiveSurfaceMode === 'detached' && !active;

    $: renderModel = buildMandalaCardRenderModel({
        viewModel,
        uiState,
        fallbackSection: $idToSection[nodeId],
        previewDialogOpen: $previewDialog.open,
        previewDialogNodeId: $previewDialog.nodeId,
        showDetailSidebar: $showDetailSidebar,
        isMobile,
        themeTone: themeSnapshot?.themeTone ?? getThemeTone(),
        themeUnderlayColor: active
            ? themeSnapshot?.activeThemeUnderlayColor ??
              themeSnapshot?.themeUnderlayColor ??
              getThemeUnderlayColor()
            : themeSnapshot?.themeUnderlayColor ?? getThemeUnderlayColor(),
    });

    const handleCardMouseDown = (e: MouseEvent) => {
        handleSwapPointerStart({
            cellRuntime,
            swapState: $swapState,
            nodeId,
            event: e,
        });
    };

    const handleCardTouchStart = (e: TouchEvent) => {
        handleSwapPointerStart({
            cellRuntime,
            swapState: $swapState,
            nodeId,
            event: e,
        });
    };

    const activateMainCardNode = (event: MouseEvent) => {
        cellRuntime.activateMainSplitNode(nodeId, event);
    };

    const enableMainCardEdit = () => {
        cellRuntime.enableMainSplitEdit(nodeId);
    };
</script>

<div
    class={clx(
        'mandala-card',
        active ? 'active-node' : !detachInactiveSurface ? 'inactive-node' : undefined,
        hasSectionColor ? 'mandala-card--with-section-color' : undefined,
        selected ? 'node-border--selected' : undefined,
        pinned ? 'node-border--pinned' : undefined,
        active ? 'node-border--active' : undefined,
        detachInactiveSurface ? 'mandala-card--detached-inactive' : undefined,
        suppressHoverSurfaceEffect ? 'mandala-card--hover-static' : undefined,
    )}
    class:mandala-card--hover-elevation={hoverElevationEnabled}
    class:mandala-card--swap-source={isSwapSourceNode($swapState, nodeId)}
    class:mandala-card--swap-target={isSwapTargetNode($swapState, nodeId)}
    class:mandala-card--swap-disabled={isSwapDisabledNode($swapState, nodeId)}
    class:is-floating-mobile={renderModel.isFloatingMobile}
    id={nodeId}
    style={detachInactiveSurface ? undefined : renderModel.cardStyle}
    on:mousedown={handleCardMouseDown}
    on:touchstart={handleCardTouchStart}
    on:click={(e) =>
        clickMandalaCard({
            cellRuntime,
            nodeId,
            isMobile,
            swapActive: $swapState.active,
            event: e,
        })}
    on:dblclick={(e) => {
        if (shouldBlockSwapDoubleClick($swapState)) return;
        doubleClickMandalaCard({
            cellRuntime,
            nodeId,
            displaySection: renderModel.displaySection,
            onMobileDoubleClick,
            isMobile,
            showDetailSidebar: $showDetailSidebar,
            event: e,
        });
    }}
>
    {#if detachInactiveSurface}
        <div
            class="mandala-card__inactive-surface mandala-card inactive-node"
            style={renderModel.surfaceStyle}
            aria-hidden="true"
        >
            {#if nodeStyle && !(renderModel.shouldHideBackgroundStyle && nodeStyle.styleVariant === 'background-color')}
                <CardStyle style={nodeStyle} />
            {/if}
        </div>
    {:else if nodeStyle && !(renderModel.shouldHideBackgroundStyle && nodeStyle.styleVariant === 'background-color')}
        <CardStyle style={nodeStyle} />
    {/if}

    <div
        class={clx(
            'mandala-card__body',
            detachInactiveSurface
                ? 'mandala-card__body--detached-inactive'
                : undefined,
        )}
        style={detachInactiveSurface ? renderModel.bodyStyle : undefined}
    >
        <CardMainContent
            {nodeId}
            style={nodeStyle}
            showInlineEditor={renderModel.showInlineEditor}
            showContent={renderModel.showContent}
            hideBuiltInHiddenInfo={renderModel.hideBuiltInHiddenInfo}
            fontSizeOffset={isMobile ? $localFontSize - 16 : 0}
            absoluteFontSize={isMobile ? $localFontSize : undefined}
            {scrollbarMode}
            {fillContent}
            density={contentDensity}
            isMobilePlatform={isMobile}
            idleScrollbarEnabled={true}
            activateNode={activateMainCardNode}
            enableEditMode={enableMainCardEdit}
            onMobilePreviewDoubleTapEdit={null}
        />

        <CardMeta
            displaySection={renderModel.displaySection}
            showSectionBackground={renderModel.showSectionBackground}
            showSectionPin={renderModel.showSectionPin}
            showSectionColorDot={renderModel.showSectionColorDot}
            capsuleTextTone={renderModel.capsuleTextTone}
            metaStyle={renderModel.metaStyle}
            density={contentDensity}
        />
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

    .mandala-card--detached-inactive {
        background: transparent;
    }

    .mandala-card__inactive-surface {
        position: absolute;
        inset: 0;
        width: auto;
        min-width: 0;
        min-height: 0;
        height: auto;
        pointer-events: none;
        z-index: 0;
        overflow: visible;
        transition: none;
    }

    .mandala-card__body {
        position: relative;
        z-index: 1;
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        width: 100%;
        min-width: 0;
        min-height: 0;
        height: 100%;
    }

    :global(.mandala-view:not(.mandala-white-theme))
        .mandala-card--hover-elevation:hover {
        z-index: 10;
    }

    :global(.mandala-view:not(.mandala-white-theme))
        .mandala-card--hover-static:hover {
        box-shadow: none !important;
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
