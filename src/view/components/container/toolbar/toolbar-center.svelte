<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import Button from 'src/view/components/container/shared/button.svelte';
    import { Grid3x3, Grid2x2, Type } from 'lucide-svelte';
    import {
        MandalaModeStore,
        Show9x9TitleOnlyStore,
    } from 'src/stores/settings/derived/view-settings-store';

    const view = getView();
    const mode = MandalaModeStore(view);
    const show9x9TitleOnly = Show9x9TitleOnlyStore(view);

    const toggleMandalaMode = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/toggle-mode',
        });
    };

    const toggle9x9TitleOnly = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/toggle-9x9-title-only',
        });
    };
</script>

<div class="toolbar-center">
    <div class="lock-toggle-container topbar-buttons-group">
        {#if $mode === '9x9'}
            <Button
                active={$show9x9TitleOnly}
                classes="topbar-button"
                label="仅显示标题"
                on:click={toggle9x9TitleOnly}
                tooltipPosition="bottom"
            >
                <Type class="svg-icon" size="18" />
            </Button>
        {/if}
        <Button
            active={$mode === '9x9'}
            classes="topbar-button"
            label={$mode === '3x3' ? '切换到 9x9' : '切换到 3x3'}
            on:click={toggleMandalaMode}
            tooltipPosition="bottom"
        >
            {#if $mode === '3x3'}
                <Grid3x3 class="svg-icon" size="18" />
            {:else}
                <Grid2x2 class="svg-icon" size="18" />
            {/if}
        </Button>
    </div>
</div>

<style>
    .toolbar-center {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
    }

    .lock-toggle-container {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    :global(.is-mobile) .lock-toggle-container {
        transform: none;
        z-index: 1002;
        background: transparent;
        padding: 0;
        border: none;
        box-shadow: none;
        border-radius: 0;
        gap: 6px;
    }
</style>
