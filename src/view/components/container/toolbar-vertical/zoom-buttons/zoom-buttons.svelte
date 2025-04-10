<script lang="ts">
    import { zoomLevelStore } from '../../../../../stores/view/derived/zoom-level-store';
    import { derived, get, writable } from 'svelte/store';
    import { createZoomMenu } from '../helpers/create-zoom-menu';
    import { ToolbarButton } from '../../../../modals/vertical-toolbar-buttons/vertical-toolbar-buttons';
    import { maxZoomLevel, minZoomLevel } from '../../../../../stores/settings/reducers/change-zoom-level';
    import { ZoomButtonsList } from './zoom-buttons-list';
    import { KeyboardStore } from '../../../../../stores/view/derived/keyboard-store';
    import { getView } from '../../context';
    import { RotateCcw, RotateCw } from 'lucide-svelte';
    import Button from '../../shared/button.svelte';

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

    let clearSavedZoomTimeoutRef: ReturnType<typeof setTimeout> | null = null;
    const clearSavedZoomValue = () => {
        if (clearSavedZoomTimeoutRef) clearTimeout(clearSavedZoomTimeoutRef);
        zoomValueBeforeReset = -1;
    };
    const saveZoomValue = () => {
        clearSavedZoomValue();
        zoomValueBeforeReset = get(zoomLevelStore(view));
        clearSavedZoomTimeoutRef = setTimeout(() => {
            zoomValueBeforeReset = -1;
        }, 1000 * 120);
    };
    const restoreZoom = () => {
        if (get(showUndoRestZoomButton)) {
            view.plugin.settings.dispatch({
                type: 'settings/view/set-zoom-level',
                payload: { value: zoomValueBeforeReset },
            });
            clearSavedZoomValue();
        } else {
            saveZoomValue();
            view.plugin.settings.dispatch({
                type: 'settings/view/set-zoom-level',
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
</script>

<div class="zoom-buttons-container">
    {#if $buttons.length > 0}
        <div class="buttons-group buttons-group--vertical">
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
                        <svelte:component this={button.icon} class="svg-icon" />
                    {/if}
                </Button>
            {/each}
        </div>
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
</style>
