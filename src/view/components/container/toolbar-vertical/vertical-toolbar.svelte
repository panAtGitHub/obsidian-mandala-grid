<script lang="ts">
    import { Platform } from 'obsidian';
    import { lang } from '../../../../lang/lang';
    import { MoreVertical } from 'lucide-svelte';
    import { getView } from '../context';
    import { derived, writable } from 'svelte/store';
    import { uiControlsStore } from '../../../../stores/view/derived/ui-controls-store';
    import Button from '../shared/button.svelte';
    import {
        ScrollSettingsStore,
        showMinimapStore,
    } from '../../../../stores/settings/derived/scrolling-store';
    import {
        ApplyGapBetweenCardsStore,
        MandalaModeStore,
        OutlineModeStore,
        ShowHiddenCardInfoStore,
    } from '../../../../stores/settings/derived/view-settings-store';
    import { VerticalToolbarButtonsList } from './vertical-toolbar-buttons-list';
    import { ToolbarButton } from 'src/view/modals/vertical-toolbar-buttons/vertical-toolbar-buttons';

    const view = getView();

    const showControls = writable(false);
    const toggleShowControls = () => {
        showControls.update((v) => !v);
    };

    const controls = uiControlsStore(view);
    const showMinimap = showMinimapStore(view);
    const scrollSettingsStore = ScrollSettingsStore(view);
    const applyGapBetweenCards = ApplyGapBetweenCardsStore(view);
    const outlineMode = OutlineModeStore(view);
    const mandalaMode = MandalaModeStore(view);
    const showHiddenCardInfo = ShowHiddenCardInfoStore(view);

    const buttons = VerticalToolbarButtonsList(view);
    const activeStates = derived(
        [
            showMinimap,
            controls,
            scrollSettingsStore,
            outlineMode,
            mandalaMode,
            applyGapBetweenCards,
            showHiddenCardInfo,
        ],
        ([
            showMinimap,
            controls,
            scrollSettingsStore,
            outlineMode,
            mandalaMode,
            applyGapBetweenCards,
            showHiddenCardInfo,
        ]) => {
            return {
                minimap: showMinimap,
                settings: controls.showSettingsSidebar,
                hotkeys: controls.showHelpSidebar,
                'style-rules': controls.showStyleRulesModal,
                'center-active-node-h': scrollSettingsStore.centerActiveNodeH,
                'center-active-node-v': scrollSettingsStore.centerActiveNodeV,
                'outline-mode': outlineMode,
                'mandala-mode': mandalaMode === '9x9',
                'space-between-cards': applyGapBetweenCards,
                'hidden-card-info': showHiddenCardInfo,
            } as Partial<Record<ToolbarButton, boolean>>;
        },
    );

    $: flattenedButtons = $buttons.flatMap((g) => g.buttons);
</script>

<div class="controls-container">
    <div class="buttons-group controls-toggle">
        <Button
            active={$showControls}
            label={lang.controls_toggle_bar}
            on:click={toggleShowControls}
            tooltipPosition="bottom"
        >
            <MoreVertical class="svg-icon" />
        </Button>
    </div>

    {#if Platform.isMobile}
        <div class="buttons-group" data-visible={$showControls}>
            {#each flattenedButtons as button (button.label)}
                <Button
                    active={$activeStates[button.id]}
                    classes="control-item"
                    label={button.label}
                    on:click={button.onClick}
                    tooltipPosition="bottom"
                >
                    {#if 'svg' in button.icon}
                        {@html button.icon.svg}
                    {:else}
                        <svelte:component this={button.icon} class="svg-icon" />
                    {/if}
                </Button>
            {/each}
        </div>
    {:else}
        {#each $buttons as group (group.id)}
            <div class="buttons-group">
                {#each group.buttons as button (button.label)}
                    <Button
                        active={$activeStates[button.id]}
                        classes="control-item"
                        label={button.label}
                        on:click={button.onClick}
                        tooltipPosition="bottom"
                    >
                        {#if 'svg' in button.icon}
                            {@html button.icon.svg}
                        {:else}
                            <svelte:component this={button.icon} class="svg-icon" />
                        {/if}
                    </Button>
                {/each}
            </div>
        {/each}
    {/if}
</div>

<style>
    .controls-container {
        gap: var(--size-4-2);
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .buttons-group {
        display: flex;
        flex-direction: row;
        gap: var(--size-4-2);
    }

    .controls-toggle {
        display: none;
    }
    :global(.is-mobile) {
        & .controls-container {
            flex-direction: row;
        }
        & .controls-toggle {
            display: block;
            z-index: 1002;
        }
        & .buttons-group[data-visible='true'] {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 45px;
            right: var(--size-4-2);
            background: var(--background-primary);
            padding: var(--size-4-2);
            border-radius: var(--radius-m);
            box-shadow: var(--shadow-l);
            border: 1px solid var(--background-modifier-border);
            z-index: 1001;
            gap: 8px;
        }
        & .buttons-group[data-visible='false'] {
            display: none;
        }
    }
</style>
