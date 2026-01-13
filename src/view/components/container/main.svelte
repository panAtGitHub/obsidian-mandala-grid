<script lang="ts">
    import { setContext } from 'svelte';
    import MandalaGrid from 'src/main';
    import { uiControlsStore } from 'src/stores/view/derived/ui-controls-store';
    import { showContextMenu } from 'src/view/actions/context-menu/show-context-menu';
    import { viewHotkeysAction } from 'src/view/actions/keyboard-shortcuts/view-hotkeys-action';
    import { mouseWheelZoom } from 'src/view/actions/mouse-wheel-zoom';
    import MandalaViewComponent from 'src/view/components/mandala/mandala-view.svelte';
    import Toolbar from 'src/view/components/container/toolbar/toolbar.svelte';
    import HotkeysModal from 'src/view/components/container/modals/hotkeys/hotkeys.svelte';
    import SettingsModal from 'src/view/components/container/modals/settings/settings.svelte';
    import SnapshotsListModal from 'src/view/components/container/modals/snapshots-list/file-histoy.svelte';
    import StyleRulesModal from 'src/view/components/container/style-rules/style-rules.svelte';
    import { MandalaView } from 'src/view/view';

    export let plugin: MandalaGrid;
    export let view: MandalaView;

    setContext('plugin', plugin);
    setContext('view', view);

    const controls = uiControlsStore(view);
</script>

<div
    class="mandala-view"
    use:viewHotkeysAction={{ view }}
    use:showContextMenu={view}
    tabindex="0"
>
    <div class={`mandala-main`} use:mouseWheelZoom={view}>
        <MandalaViewComponent />

        {#if $controls.showHistorySidebar}
            <SnapshotsListModal />
        {/if}
        {#if $controls.showHelpSidebar}
            <HotkeysModal />
        {/if}
        {#if $controls.showSettingsSidebar}
            <SettingsModal />
        {/if}
        {#if $controls.showStyleRulesModal}
            <StyleRulesModal />
        {/if}
    </div>
</div>

<style>
    .mandala-main {
        display: flex;
        height: 100%;
        flex: 1 1 auto;
        width: 0; /* ensures it shrinks properly when the minimap is visible */
        position: relative;
    }

    .mandala-view {
        background-color: var(--background-container);
        display: flex;
        height: 100%;
        width: 100%;
    }
</style>
