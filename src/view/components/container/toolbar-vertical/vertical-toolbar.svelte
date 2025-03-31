<script lang="ts">
    import { lang } from '../../../../lang/lang';
    import { MoreVertical } from 'lucide-svelte';
    import { getView } from '../context';
    import { derived, writable } from 'svelte/store';
    import { uiControlsStore } from '../../../../stores/view/derived/ui-controls-store';
    import Button from '../shared/button.svelte';
    import { ScrollSettingsStore, showMinimapStore } from '../../../../stores/settings/derived/scrolling-store';
    import {
        ApplyGapBetweenCardsStore,
        OutlineModeStore
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

    const buttons = VerticalToolbarButtonsList(view);
    const activeStates = derived(
        [
            showMinimap,
            controls,
            scrollSettingsStore,
            outlineMode,
            applyGapBetweenCards,
        ],
        ([
            showMinimap,
            controls,
            scrollSettingsStore,
            outlineMode,
            applyGapBetweenCards,
        ]) => {
            return {
                minimap: showMinimap,
                settings: controls.showSettingsSidebar,
                hotkeys: controls.showHelpSidebar,
                'style-rules': controls.showStyleRulesModal,
                'center-active-node-h': scrollSettingsStore.centerActiveNodeH,
                'center-active-node-v': scrollSettingsStore.centerActiveNodeV,
                'outline-mode': outlineMode,
                'space-between-cards': applyGapBetweenCards,
            } as Partial<Record<ToolbarButton, boolean>>;
        },
    );


</script>

<div class="controls-container">
    <div class="buttons-group controls-toggle">
        <Button
            active={$showControls}
            label={lang.controls_toggle_bar}
            on:click={toggleShowControls}
            tooltipPosition="left"
        >
            <MoreVertical class="svg-icon" />
        </Button>
    </div>

    {#each $buttons as group (group.id)}
        <div
            class="buttons-group buttons-group--vertical"
            data-visible={$showControls}
        >
            {#each group.buttons as button (button.label)}
                <Button
                    active={$activeStates[button.id]}
                    classes="control-item"
                    label={button.label}
                    on:click={button.onClick}
                    tooltipPosition="left"

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
</div>

<style>
    .controls-container {
        right: var(--size-4-2);
        top: var(--size-4-2);
        gap: var(--size-4-2);
        display: flex;
        flex-direction: column;
        position: absolute;
        z-index: 2;
    }


    .controls-toggle {
        display: none;
    }
    :global(.is-mobile) {
        & .controls-toggle {
            display: block;
        }
        & .buttons-group[data-visible='false'] {
            display: none;
        }
    }
</style>
