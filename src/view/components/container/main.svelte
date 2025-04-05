<script lang="ts">
    import VerticalToolbar from './toolbar-vertical/vertical-toolbar.svelte';
    import ZoomButtons from './toolbar-vertical/zoom-buttons/zoom-buttons.svelte';
    import Container from './container-wrapper.svelte';
    import Breadcrumbs from './breadcrumbs/breadcrumbs.svelte';
    import Toolbar from './toolbar/toolbar.svelte';
    import Settings from 'src/view/components/container/modals/settings/settings.svelte';
    import FileHistory from 'src/view/components/container/modals/snapshots-list/file-histoy.svelte';
    import Hotkeys from 'src/view/components/container/modals/hotkeys/hotkeys.svelte';
    import { LineageView } from '../../view';
    import Lineage from '../../../main';
    import { setContext } from 'svelte';
    import { uiControlsStore } from 'src/stores/view/derived/ui-controls-store';
    import { viewHotkeysAction } from 'src/view/actions/keyboard-shortcuts/view-hotkeys-action';
    import { mouseWheelZoom } from 'src/view/actions/mouse-wheel-zoom';
    import RightSidebar from './right-sidebar/right-sidebar.svelte';
    import { clickAndDrag } from 'src/view/actions/click-and-drag/click-and-drag';
    import LeftSidebar from 'src/view/components/container/left-sidebar/left-sidebar.svelte';
    import { showContextMenu } from 'src/view/actions/context-menu/show-context-menu';
    import DNDEdges from './dnd/dnd-edges.svelte';
    import StyleRules from './style-rules/style-rules.svelte';

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
    <LeftSidebar />

    <div class={`lineage-main`} use:mouseWheelZoom={view} use:clickAndDrag="{view}">
        <Container />
        <Toolbar />
        <Breadcrumbs />
        <VerticalToolbar />
        <ZoomButtons/>
        {#if $controls.showHistorySidebar}
            <FileHistory />
        {:else if $controls.showHelpSidebar}
            <Hotkeys />
        {:else if $controls.showSettingsSidebar}
            <Settings />
        {:else if $controls.showStyleRulesModal}
            <StyleRules />
        {/if}

        <DNDEdges />
    </div>
    <RightSidebar />
</div>

<style>
    .lineage-main {
        --z-index-breadcrumbs: 10;

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
