<script lang="ts">
    import { Platform } from 'obsidian';
    import { onDestroy, onMount } from 'svelte';
    import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
    import type {
        SceneProjection,
        SceneRootShellProps,
    } from 'src/mandala-scenes/shared/scene-projection';
    import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
    import SceneRuntimeHost from 'src/mandala-scenes/shared/scene-runtime-host.svelte';
    import { createMobileEditorViewportController } from 'src/mandala-scenes/shared/mobile-editor-viewport';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
    import VerticalToolbar from 'src/ui/toolbar/vertical/vertical-toolbar.svelte';
    import Toolbar from 'src/ui/toolbar/main/toolbar.svelte';
    import ToolbarCenter from 'src/ui/toolbar/main/toolbar-center.svelte';
    import MandalaDetailSidebar from 'src/ui/sidebar/mandala-detail-sidebar.svelte';
    import MobileFullScreenSearch from 'src/ui/modals/mobile-fullscreen-search.svelte';
    import MobileNativeEditorSheet from 'src/ui/modals/mobile-native-editor-sheet.svelte';
    import type { EditingState } from 'src/stores/view/default-view-state';
    import {
        resolveDesktopSquareSize,
        resolveSceneThemeSnapshot,
    } from 'src/mandala-scenes/shared/root-shell-state';

    const view = getView();
    const DEFAULT_THEME_SNAPSHOT: MandalaThemeSnapshot = {
        themeTone: 'light',
        themeUnderlayColor: '',
        activeThemeUnderlayColor: '',
    };

    export let sceneKey: SceneRootShellProps['sceneKey'] = {
        viewKind: '3x3',
        variant: 'default',
    };
    export let committedSceneKey: MandalaSceneKey = sceneKey;
    export let projection: SceneProjection;
    export let squareSize = 0;
    export let isPortrait = false;
    export let showDetailSidebar = false;
    export let detailSidebarWidth = 0;
    export let squareLayout = false;
    export let whiteThemeMode = false;
    export let a4Mode = false;
    export let a4Orientation: 'portrait' | 'landscape' = 'landscape';
    export let borderOpacity = 100;
    export let gridHighlightColor = '';
    export let gridHighlightWidth = 0;
    export let isMobilePopupEditing = false;
    export let isMobileFullScreenSearch = false;
    export let editingState: EditingState = {
        activeNodeId: '',
        isInSidebar: false,
    };
    export let mobilePopupFontSize = 16;
    export let onSave: () => void = () => undefined;
    export let onIncreaseFontSize: () => void = () => undefined;
    export let onDecreaseFontSize: () => void = () => undefined;
    export let onMobileEditorFocusIn: () => void = () => undefined;
    export let onMobileEditorFocusOut: () => void = () => undefined;
    export let sceneThemeSnapshot: MandalaThemeSnapshot =
        DEFAULT_THEME_SNAPSHOT;
    export let desktopSquareSize = 0;

    let containerRef: HTMLElement | null = null;
    let contentWrapperRef: HTMLElement | null = null;
    let contentWrapperObserver: ResizeObserver | null = null;
    let bodyThemeObserver: MutationObserver | null = null;
    let mobilePopupEditorBodyEl: HTMLDivElement | null = null;

    const mobileEditorViewport = createMobileEditorViewportController();
    const mobileViewportHeight = mobileEditorViewport.height;
    const mobileViewportOffsetTop = mobileEditorViewport.offsetTop;
    const mobileViewportBottomInset = mobileEditorViewport.bottomInset;
    const mobileKeyboardOverlayFallback = mobileEditorViewport.keyboardFallback;

    const readSceneThemeSnapshot = (): MandalaThemeSnapshot => {
        return resolveSceneThemeSnapshot(
            document.body,
            window.getComputedStyle(document.body),
        );
    };

    const recomputeDesktopSquareSize = () => {
        if (!contentWrapperRef) {
            desktopSquareSize = 0;
            return;
        }

        const rect = contentWrapperRef.getBoundingClientRect();
        desktopSquareSize = resolveDesktopSquareSize({
            isMobile: Platform.isMobile,
            squareLayout,
            wrapperWidth: rect.width,
            wrapperHeight: rect.height,
            showDetailSidebar,
            detailSidebarWidth,
        });
    };

    onMount(() => {
        view.container = containerRef;
        focusContainer(view);
        mobileEditorViewport.mount();
        sceneThemeSnapshot = readSceneThemeSnapshot();
        bodyThemeObserver = new MutationObserver(() => {
            sceneThemeSnapshot = readSceneThemeSnapshot();
        });
        bodyThemeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });

        contentWrapperObserver = new ResizeObserver(() => {
            recomputeDesktopSquareSize();
        });
        if (contentWrapperRef) {
            contentWrapperObserver.observe(contentWrapperRef);
        }
        recomputeDesktopSquareSize();
    });

    onDestroy(() => {
        mobileEditorViewport.destroy();
        contentWrapperObserver?.disconnect();
        contentWrapperObserver = null;
        bodyThemeObserver?.disconnect();
        bodyThemeObserver = null;
    });

    $: {
        mobileEditorViewport.sync(
            isMobilePopupEditing,
            mobilePopupEditorBodyEl,
        );
    }

    $: if (!Platform.isMobile) {
        squareLayout;
        showDetailSidebar;
        detailSidebarWidth;
        recomputeDesktopSquareSize();
    }

    const handleMobileEditorFocusIn = () => {
        mobileEditorViewport.handleFocusIn();
        onMobileEditorFocusIn();
    };

    const handleMobileEditorFocusOut = () => {
        mobileEditorViewport.handleFocusOut();
        onMobileEditorFocusOut();
    };
</script>

<div
    class="mandala-root"
    class:mandala-root--3={committedSceneKey.viewKind === '3x3'}
    class:mandala-root--9={committedSceneKey.viewKind === '9x9'}
    class:mandala-root--nx9={committedSceneKey.viewKind === 'nx9'}
    class:mandala-root--week={committedSceneKey.variant === 'week-7x9'}
    class:is-editing-mobile={isMobilePopupEditing}
    class:is-square-layout={Platform.isMobile && showDetailSidebar}
    class:is-desktop-square-layout={!Platform.isMobile && squareLayout}
    class:has-detail-sidebar={!Platform.isMobile && showDetailSidebar}
    class:is-portrait={isPortrait}
    class:mandala-white-theme={whiteThemeMode}
    class:mandala-a4-mode={a4Mode}
    class:mandala-a4-landscape={a4Mode && a4Orientation === 'landscape'}
    style="--mandala-square-size: {squareSize}px; --desktop-square-size: {desktopSquareSize}px; --mandala-border-opacity: {borderOpacity}%; --mandala-grid-highlight-color: {gridHighlightColor ||
        'var(--mandala-color-selection)'}; --mandala-grid-highlight-width: {gridHighlightWidth}px; --vvh: {$mobileViewportHeight ||
        window.innerHeight}px; --vvo: {$mobileViewportOffsetTop}px; --vvb: {$mobileViewportBottomInset}px; --vkf: {$mobileKeyboardOverlayFallback}px;"
>
    {#if isMobilePopupEditing}
        <MobileNativeEditorSheet
            nodeId={editingState.activeNodeId}
            fontSize={mobilePopupFontSize}
            bind:editorBodyEl={mobilePopupEditorBodyEl}
            on:save={onSave}
            on:focusin={handleMobileEditorFocusIn}
            on:focusout={handleMobileEditorFocusOut}
            on:increasefontsize={onIncreaseFontSize}
            on:decreasefontsize={onDecreaseFontSize}
        />
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
                <SceneRuntimeHost
                    {sceneKey}
                    {projection}
                    bind:committedSceneKey
                />
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
        --mandala-gap: var(
            --node-gap-setting,
            calc(var(--mandala-core-gap) / 4)
        );
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
        overflow-y: auto;
        overflow-x: hidden;
        padding: 12px;
    }

    :global(body:not(.is-mobile))
        .mandala-root:not(.mandala-a4-mode)
        .mandala-scroll {
        padding: 12px;
    }

    .mandala-content-wrapper {
        flex: 1 1 auto;
        display: flex;
        flex-direction: row;
        min-height: 0;
        overflow: hidden;
    }

    .is-desktop-square-layout:not(.has-detail-sidebar)
        .mandala-content-wrapper {
        justify-content: center;
    }

    .is-square-layout .mandala-content-wrapper {
        flex-direction: row;
    }
    .is-square-layout.is-portrait .mandala-content-wrapper {
        flex-direction: column;
    }

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

    .is-portrait .mandala-content-wrapper {
        flex-direction: column;
    }

    .is-desktop-square-layout .mandala-scroll {
        flex: 0 0 auto;
        width: var(--desktop-square-size);
        height: var(--desktop-square-size);
        overflow-y: auto;
        overflow-x: hidden;
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
        margin: 0 auto;
    }

    .mandala-a4-mode.mandala-root--3:not(.mandala-white-theme)
        :global(.mandala-card),
    .mandala-a4-mode.mandala-root--nx9:not(.mandala-white-theme)
        :global(.mandala-card),
    .mandala-a4-mode.mandala-root--week:not(.mandala-white-theme)
        :global(.mandala-card) {
        border: 1px solid var(--text-normal) !important;
        border-left-width: 1px !important;
        border-radius: 0 !important;
        box-shadow: none !important;
    }

    .mandala-root--3:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card),
    .mandala-root--nx9:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card),
    .mandala-root--week:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card) {
        border-left-width: 0 !important;
        border-left-style: solid !important;
    }

    .mandala-root--3:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--active),
    .mandala-root--3:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--selected),
    .mandala-root--nx9:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--active),
    .mandala-root--nx9:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--selected),
    .mandala-root--week:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--active),
    .mandala-root--week:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--selected) {
        border-left-color: transparent !important;
    }

    .mandala-a4-mode.mandala-root--3 :global(.mandala-card.active-node),
    .mandala-a4-mode.mandala-root--3
        :global(.mandala-card.node-border--selected),
    .mandala-a4-mode.mandala-root--nx9 :global(.mandala-card.active-node),
    .mandala-a4-mode.mandala-root--nx9
        :global(.mandala-card.node-border--selected),
    .mandala-a4-mode.mandala-root--week :global(.mandala-card.active-node),
    .mandala-a4-mode.mandala-root--week
        :global(.mandala-card.node-border--selected),
    .mandala-white-theme.mandala-root--3 :global(.mandala-card.active-node),
    .mandala-white-theme.mandala-root--3
        :global(.mandala-card.node-border--selected),
    .mandala-white-theme.mandala-root--nx9 :global(.mandala-card.active-node),
    .mandala-white-theme.mandala-root--nx9
        :global(.mandala-card.node-border--selected),
    .mandala-white-theme.mandala-root--week :global(.mandala-card.active-node),
    .mandala-white-theme.mandala-root--week
        :global(.mandala-card.node-border--selected) {
        position: relative;
    }

    .mandala-a4-mode.mandala-root--3:not(.mandala-white-theme)
        :global(.mandala-card.active-node)::before,
    .mandala-a4-mode.mandala-root--3:not(.mandala-white-theme)
        :global(.mandala-card.node-border--selected)::before,
    .mandala-a4-mode.mandala-root--nx9:not(.mandala-white-theme)
        :global(.mandala-card.active-node)::before,
    .mandala-a4-mode.mandala-root--nx9:not(.mandala-white-theme)
        :global(.mandala-card.node-border--selected)::before,
    .mandala-a4-mode.mandala-root--week:not(.mandala-white-theme)
        :global(.mandala-card.active-node)::before,
    .mandala-a4-mode.mandala-root--week:not(.mandala-white-theme)
        :global(.mandala-card.node-border--selected)::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 2;
        border: 1px solid var(--text-normal);
        pointer-events: none;
        box-sizing: border-box;
        border-radius: 0;
    }

    .mandala-a4-mode.mandala-root--3 :global(.mandala-card.active-node)::after,
    .mandala-a4-mode.mandala-root--3
        :global(.mandala-card.node-border--selected)::after,
    .mandala-a4-mode.mandala-root--nx9
        :global(.mandala-card.active-node)::after,
    .mandala-a4-mode.mandala-root--nx9
        :global(.mandala-card.node-border--selected)::after,
    .mandala-a4-mode.mandala-root--week
        :global(.mandala-card.active-node)::after,
    .mandala-a4-mode.mandala-root--week
        :global(.mandala-card.node-border--selected)::after,
    .mandala-white-theme.mandala-root--3
        :global(.mandala-card.active-node)::after,
    .mandala-white-theme.mandala-root--3
        :global(.mandala-card.node-border--selected)::after,
    .mandala-white-theme.mandala-root--nx9
        :global(.mandala-card.active-node)::after,
    .mandala-white-theme.mandala-root--nx9
        :global(.mandala-card.node-border--selected)::after,
    .mandala-white-theme.mandala-root--week
        :global(.mandala-card.active-node)::after,
    .mandala-white-theme.mandala-root--week
        :global(.mandala-card.node-border--selected)::after {
        content: '';
        position: absolute;
        inset: 2px;
        z-index: 3;
        border: var(--mandala-grid-highlight-width, 2px) solid
            var(--mandala-grid-highlight-color, var(--mandala-color-selection));
        pointer-events: none;
        box-sizing: border-box;
        border-radius: 0;
    }

    .mandala-root--3 {
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: visible;
    }

    .mandala-root--week {
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--nx9 {
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--9 {
        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .is-editing-mobile.mandala-root {
        height: var(--vvh, 100dvh) !important;
        overflow: hidden !important;
    }
</style>
