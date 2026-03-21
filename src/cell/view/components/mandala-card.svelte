<script lang="ts">
    import clx from 'classnames';
    import CardMainContent from 'src/cell/view/components/card-main-content.svelte';
    import CardMeta from 'src/cell/view/components/card-meta.svelte';
    import type { CellGridPosition } from 'src/cell/model/card-types';
    import type { CellDisplayPolicy } from 'src/cell/model/cell-display-policy';
    import CardStyle from 'src/cell/view/style/card-style.svelte';
    import { buildMandalaCardRenderModel } from 'src/cell/model/build-mandala-card-render-model';
    import { NodeStyle } from 'src/stores/settings/types/style-rules-types';
    import { getView } from 'src/views/shared/shell/context';
    import { Platform } from 'obsidian';
    import { ShowMandalaDetailSidebarStore } from 'src/stores/settings/derived/view-settings-store';
    import { derived } from 'src/lib/store/derived';
    import { localFontStore } from 'src/stores/local-font-store';
    import { type ThemeTone } from 'src/helpers/views/mandala/contrast-text-tone';
    import type { MandalaCardRenderModel } from 'src/cell/model/card-render-model';
    import type { CellInteractionPolicy } from 'src/cell/viewmodel/policies/cell-interaction-policy';
    import {
        clickMandalaCard,
        doubleClickMandalaCard,
    } from 'src/cell/viewmodel/controller/mandala-card-controller';
    import {
        handleSwapPointerStart,
        isSwapDisabledNode,
        isSwapSourceNode,
        isSwapTargetNode,
        shouldBlockSwapDoubleClick,
    } from 'src/cell/viewmodel/controller/swap-controller';

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
    export let displayPolicy: CellDisplayPolicy;
    export let interactionPolicy: CellInteractionPolicy;
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
    let renderModel: MandalaCardRenderModel;

    $: renderModel = buildMandalaCardRenderModel({
        nodeId,
        section,
        fallbackSection: $idToSection[nodeId],
        active,
        editing,
        pinned,
        style,
        sectionColor,
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
    {#if style &&
    !(renderModel.shouldHideBackgroundStyle &&
        style.styleVariant === 'background-color')}
        <CardStyle {style} />
    {/if}

    <CardMainContent
        {nodeId}
        {style}
        isInSidebar={false}
        showInlineEditor={renderModel.showInlineEditor}
        showContent={renderModel.showContent}
        hideBuiltInHiddenInfo={renderModel.hideBuiltInHiddenInfo}
        fontSizeOffset={isMobile ? $localFontStore - 16 : 0}
        absoluteFontSize={isMobile ? $localFontStore : undefined}
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

    .mandala-card-meta {
        position: absolute;
        top: 8px;
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

    .mandala-card-meta__color-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--mandala-card-meta-accent, currentColor);
        box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 16%, transparent);
        flex: 0 0 auto;
    }

    .mandala-card-meta__lock {
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
