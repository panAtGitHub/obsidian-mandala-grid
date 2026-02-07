<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import {
        LeftSidebarActiveTabStore,
        ShowLeftSidebarStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { onDestroy, onMount } from 'svelte';
    import { showMinimapStore } from '../../../../stores/settings/derived/scrolling-store';
    import Minimap from '../minimap/minimap.svelte';

    const MIN_WIDTH = 184;
    // used to animate using CSS transition width, can go to 0
    let animatedSidebarWidth = 0;
    // this width does not go to 0
    let sidebarWidth = MIN_WIDTH;
    // used to keep showing the minimap during the hide-sidebar animation
    let showMinimap = false;
    let showMinimapTimeout: ReturnType<typeof setTimeout> | null = null;

    const view = getView();
    const showSidebarStore = showMinimapStore(view);

    const toggleMinimap = (on: boolean) => {
        if (on) {
            showMinimap = true;
            showMinimapTimeout = setTimeout(() => {
                view.contentEl.addClass('mandala-view__content-el--minimap-on');
            }, 150);
        } else {
            setTimeout(() => {
                view.contentEl.removeClass(
                    'mandala-view__content-el--minimap-on',
                );
            }, 150);
            showMinimapTimeout = setTimeout(() => {
                showMinimap = false;
            }, 400);
        }
    };
    $: {
        if (showMinimapTimeout) clearTimeout(showMinimapTimeout);
        if ($showSidebarStore) {
            animatedSidebarWidth = MIN_WIDTH;
            sidebarWidth = MIN_WIDTH;
            toggleMinimap(true);
        } else {
            animatedSidebarWidth = 0;
            toggleMinimap(false);
        }
    }
</script>

<div
    class="mandala-right-sidebar"
    style="--animated-sidebar-width: {animatedSidebarWidth}px; --sidebar-width: {sidebarWidth}px; }"
>
    {#if showMinimap}
        <Minimap />
    {/if}
</div>

<style>
    .mandala-right-sidebar {
        --node-width: calc(var(--sidebar-width) - 40px);
        flex: 0 0 auto;
        width: var(--animated-sidebar-width);
        position: relative;
        overflow: hidden;

        transition: width 0.3s ease;
    }
</style>
