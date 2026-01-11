<script lang="ts">
    import { setContext } from 'svelte';
    import Lineage from 'src/main';
    import { uiControlsStore } from 'src/stores/view/derived/ui-controls-store';
    import { showContextMenu } from 'src/view/actions/context-menu/show-context-menu';
    import { viewHotkeysAction } from 'src/view/actions/keyboard-shortcuts/view-hotkeys-action';
    import { mouseWheelZoom } from 'src/view/actions/mouse-wheel-zoom';
    import MandalaView from 'src/view/components/mandala/mandala-view.svelte';
    import Toolbar from 'src/view/components/container/toolbar/toolbar.svelte';
    import HotkeysModal from 'src/view/components/container/modals/hotkeys/hotkeys.svelte';
    import SettingsModal from 'src/view/components/container/modals/settings/settings.svelte';
    import SnapshotsListModal from 'src/view/components/container/modals/snapshots-list/file-histoy.svelte';
    import StyleRulesModal from 'src/view/components/container/style-rules/style-rules.svelte';
    import { LineageView } from 'src/view/view';

    export let plugin: Lineage;
    export let view: LineageView;

    setContext('plugin', plugin);
    setContext('view', view);

    const controls = uiControlsStore(view);
</script>

<div
    class="lineage-view"
    use:viewHotkeysAction={{ view }}
    use:showContextMenu={view}
    tabindex="0"
>
    <div class={`lineage-main`} use:mouseWheelZoom={view}>
        <MandalaView />
        <Toolbar />

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
    .lineage-main {
        display: flex;
        height: 100%;
        flex: 1 1 auto;
        width: 0; /* ensures it shrinks properly when the minimap is visible */
        position: relative;
    }

    .lineage-view {
        background-color: var(--background-container);
        display: flex;
        height: 100%;
        width: 100%;
    }
</style>
