<script lang="ts">
    import { zoomLevelStore } from '../../../../../stores/view/derived/zoom-level-store';
    import { derived, get, writable } from 'svelte/store';
    import { createZoomMenu } from '../helpers/create-zoom-menu';
    import { ToolbarButton } from '../../../../modals/vertical-toolbar-buttons/vertical-toolbar-buttons';
    import { maxZoomLevel, minZoomLevel } from '../../../../../stores/settings/reducers/change-zoom-level';
    import { ZoomButtonsList } from './zoom-buttons-list';
    import { KeyboardStore } from '../../../../../stores/view/derived/keyboard-store';
    import { getView } from '../../context';
    import { ChevronDown, RotateCcw, RotateCw, ZoomIn } from 'lucide-svelte';
    import Button from '../../shared/button.svelte';
    import { AlwaysShowZoomButtons } from '../../../../../stores/settings/derived/view-settings-store';
    import { showZoomButtons } from 'src/view/components/container/toolbar-vertical/zoom-buttons/zoom-buttons-state';
    import { lang } from 'src/lang/lang';

    const view = getView();
    const keyboardStore = KeyboardStore(view);
    const zoomLevel = zoomLevelStore(view);

    const showUndoRestZoomButton = writable(false);
    let zoomValueBeforeReset = -1;
    $: {
        showUndoRestZoomButton.set(
            $keyboardStore.shift && zoomValueBeforeReset !== -1,
        );
    }

    const restoreZoom = () => {
        if (get(showUndoRestZoomButton)) {
            view.plugin.settings.dispatch({
                type: 'UI/CHANGE_ZOOM_LEVEL',
                payload: { value: zoomValueBeforeReset },
            });
            zoomValueBeforeReset = -1;
        } else {
            zoomValueBeforeReset = get(zoomLevelStore(view));
            view.plugin.settings.dispatch({
                type: 'UI/CHANGE_ZOOM_LEVEL',
                payload: { value: 1 },
            });
        }
    };

    const zoomMenuState = {
        menuHeight: 0,
        menuWidth: 0,
        lastMenuHideEvent_ms: 0,
    };

    const showZoomPopupMenu = (event: MouseEvent) => {
        if (Date.now() - zoomMenuState.lastMenuHideEvent_ms < 100) return;

        createZoomMenu({
            event: event,
            view,
            state: zoomMenuState,
        });
    };

    const buttons = ZoomButtonsList(view, restoreZoom, showZoomPopupMenu);
    const activeStates = derived(
        [zoomLevel, showUndoRestZoomButton],
        ([zoomLevel, showUndoRestZoomButton]) => {
            return {
                'zoom-reset': showUndoRestZoomButton ? true : zoomLevel !== 1,
            } as Partial<Record<ToolbarButton, boolean>>;
        },
    );

    const disabledStates = derived(
        [zoomLevel, showUndoRestZoomButton],
        ([zoomLevel, showUndoRestZoomButton]) => {
            return {
                'zoom-in': zoomLevel >= maxZoomLevel,
                'zoom-out': zoomLevel <= minZoomLevel,
                'zoom-reset': showUndoRestZoomButton ? false : zoomLevel === 1,
            } as Partial<Record<ToolbarButton, boolean>>;
        },
    );


    const toggleView = () => {
        showZoomButtons.update(value=>!value)
    };
    const alwaysShowZoomButtons = AlwaysShowZoomButtons(view.plugin);
</script>

<div class="zoom-buttons-container">
    {#if $buttons.length > 0}
        <div class="buttons-group buttons-group--vertical">
            {#if $showZoomButtons || $buttons[0].buttons.length === 1 || $buttons[0].buttons.length === 2 || $alwaysShowZoomButtons}
                {#each $buttons[0].buttons as button (button.label)}
                    <Button
                        active={$activeStates[button.id]}
                        classes="control-item"
                        label={button.label}
                        on:click={button.onClick}
                        tooltipPosition="left"
                        disabled={$disabledStates[button.id]}
                    >
                        {#if 'svg' in button.icon}
                            {@html button.icon.svg}
                        {:else if button.id === 'zoom-reset'}
                            {#if $showUndoRestZoomButton}
                                <RotateCw class="svg-icon" />
                            {:else}
                                <RotateCcw class="svg-icon" />
                            {/if}
                        {:else}
                            <svelte:component
                                this={button.icon}
                                class="svg-icon"
                            />
                        {/if}
                    </Button>
                {/each}
            {/if}
        </div>
        {#if !$alwaysShowZoomButtons && $buttons[0].buttons.length > 2}
            <div
                class={'buttons-group buttons-group--vertical' + ' zoom-toggle'}
            >
                <Button on:click={toggleView} label={lang.controls_toogle_zoom_buttons} tooltipPosition="top">
                    {#if !$showZoomButtons}
                        <ZoomIn class="svg-icon" />
                    {:else}
                        <ChevronDown class="svg-icon" />
                    {/if}
                </Button>
            </div>
        {/if}
    {/if}
</div>

<style>
    .zoom-buttons-container {
        right: var(--size-4-2);
        bottom: var(--size-4-2);
        gap: var(--size-4-2);
        display: flex;
        flex-direction: column;
        position: absolute;
        z-index: 2;
    }
    .zoom-toggle {
        opacity: 0.6;
        &:hover {
            opacity: 1;
        }
    }

</style>
