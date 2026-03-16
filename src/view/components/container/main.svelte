<script lang="ts">
    import { setContext } from 'svelte';
    import MandalaGrid from 'src/main';
    import { uiControlsStore } from 'src/stores/view/derived/ui-controls-store';
    import { showContextMenu } from 'src/view/actions/context-menu/show-context-menu';
    import { viewHotkeysAction } from 'src/view/actions/keyboard-shortcuts/view-hotkeys-action';
    import { mouseWheelZoom } from 'src/view/actions/mouse-wheel-zoom';
    import MandalaViewComponent from 'src/view/components/mandala/mandala-view.svelte';
    import CellPreviewDialog from 'src/view/components/mandala/cell-preview-dialog.svelte';
    import HotkeysModal from 'src/view/components/container/modals/hotkeys/hotkeys.svelte';
    import SettingsModal from 'src/view/components/container/modals/settings/settings.svelte';
    import { MandalaView } from 'src/view/view';
    import { localFontStore } from 'src/stores/local-font-store';
    import {
        LeftSidebarWidthStore,
        MandalaFontSize3x3DesktopStore,
        MandalaFontSize3x3MobileStore,
        MandalaFontSize7x9DesktopStore,
        MandalaFontSize7x9MobileStore,
        MandalaFontSize9x9DesktopStore,
        MandalaFontSize9x9MobileStore,
        MandalaFontSizeSidebarDesktopStore,
        MandalaFontSizeSidebarMobileStore,
        ShowLeftSidebarStore,
        WhiteThemeModeStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import LeftSidebar from 'src/view/components/container/left-sidebar/left-sidebar.svelte';
    import { Platform } from 'obsidian';

    export let plugin: MandalaGrid;
    export let view: MandalaView;

    setContext('plugin', plugin);
    setContext('view', view);

    const controls = uiControlsStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);
    const showLeftSidebar = ShowLeftSidebarStore(view);
    const leftSidebarWidth = LeftSidebarWidthStore(view);
    const mandalaFont3x3Desktop = MandalaFontSize3x3DesktopStore(view);
    const mandalaFont3x3Mobile = MandalaFontSize3x3MobileStore(view);
    const mandalaFont9x9Desktop = MandalaFontSize9x9DesktopStore(view);
    const mandalaFont9x9Mobile = MandalaFontSize9x9MobileStore(view);
    const mandalaFont7x9Desktop = MandalaFontSize7x9DesktopStore(view);
    const mandalaFont7x9Mobile = MandalaFontSize7x9MobileStore(view);
    const mandalaFontSidebarDesktop = MandalaFontSizeSidebarDesktopStore(view);
    const mandalaFontSidebarMobile = MandalaFontSizeSidebarMobileStore(view);

    $: mandalaFont3x3 = Platform.isMobile
        ? $mandalaFont3x3Mobile
        : $mandalaFont3x3Desktop;
    $: mandalaFont9x9 = Platform.isMobile
        ? $mandalaFont9x9Mobile
        : $mandalaFont9x9Desktop;
    $: mandalaFont7x9 = Platform.isMobile
        ? $mandalaFont7x9Mobile
        : $mandalaFont7x9Desktop;
    $: mandalaFontSidebar = Platform.isMobile
        ? $mandalaFontSidebarMobile
        : $mandalaFontSidebarDesktop;
</script>

<div
    class="mandala-view"
    class:mandala-white-theme={!Platform.isMobile && $whiteThemeMode}
    style={`--font-text-size: ${$localFontStore}px; --mandala-font-3x3: ${mandalaFont3x3}px; --mandala-font-9x9: ${mandalaFont9x9}px; --mandala-font-7x9: ${mandalaFont7x9}px; --mandala-font-sidebar: ${mandalaFontSidebar}px;`}
    use:viewHotkeysAction={{ view }}
    use:showContextMenu={view}
    tabindex="0"
>
    <div class="mandala-main" use:mouseWheelZoom={view}>
        <LeftSidebar />
        {#if Platform.isMobile && $showLeftSidebar}
            <div
                class="left-sidebar-overlay"
                style={`left: ${$leftSidebarWidth}px;`}
                on:click={() => {
                    view.plugin.settings.dispatch({
                        type: 'view/left-sidebar/toggle',
                    });
                }}
            />
        {/if}
        <MandalaViewComponent />
        <CellPreviewDialog />
        {#if $controls.showHelpSidebar}
            <HotkeysModal />
        {/if}
        {#if $controls.showSettingsSidebar}
            <SettingsModal />
        {/if}
    </div>
</div>

<style>
    .mandala-main {
        display: flex;
        height: 100%;
        flex: 1 1 auto;
        width: 0; /* allows flexible shrink within the split layout */
        position: relative;
    }

    .left-sidebar-overlay {
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        background: transparent;
        z-index: 1500;
    }

    .mandala-view {
        background-color: var(--background-container);
        display: flex;
        height: 100%;
        width: 100%;
    }

    :global(.is-mobile) .mandala-view {
        user-select: none;
        -webkit-user-select: none;
    }
</style>
