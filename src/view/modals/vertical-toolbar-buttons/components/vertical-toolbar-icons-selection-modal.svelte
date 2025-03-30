<script lang="ts">
    import { ToolbarButton, verticalToolbarButtons } from '../vertical-toolbar-buttons';
    import Button from '../../../components/container/shared/button.svelte';
    import { derived } from 'svelte/store';
    import {
        AlwaysShowZoomButtons,
        HiddenVerticalToolbarButtons
    } from '../../../../stores/settings/derived/view-settings-store';
    import Lineage from '../../../../main';
    import { lang } from 'src/lang/lang';

    export let close: () => void;
    export let plugin: Lineage;

    const buttons = derived(
        [HiddenVerticalToolbarButtons(plugin)],
        ([hidden]) => {
            const set = new Set(hidden);
            if (set.size > 0) {
                return verticalToolbarButtons.map((bs) => ({
                    id: bs.id,
                    buttons: bs.buttons.map((b) => ({
                        ...b,
                        hidden: set.has(b.id),
                    })),
                }));
            } else return verticalToolbarButtons;
        },
    );
    const onChange = (button: ToolbarButton, hidden: boolean) => {
        plugin.settings.dispatch({
            type: 'settings/view/vertical-toolbar/set-hidden-button',
            payload: {
                id: button,
                hide: hidden,
            },
        });
    };
    const alwaysShowZoomButtons = AlwaysShowZoomButtons(plugin);
</script>

<div class="buttons-list">
    {#each $buttons as group (group.id)}
        {#each group.buttons as button (button.label)}
            <div class="button-list-item">
                <input
                    type="checkbox"
                    on:change={(e) => {
                        onChange(button.id, !e.currentTarget.checked);
                    }}
                    checked={!button.hidden}
                />
                <Button
                    classes="control-item"
                    label={button.label}
                    tooltipPosition="left"
                >
                    {#if 'svg' in button.icon}
                        {@html button.icon.svg}
                    {:else}
                        <svelte:component this={button.icon} class="svg-icon" />
                    {/if}
                </Button>
                <span class="toolbar-icon-label">{button.label}</span>
            </div>
        {/each}
    {/each}
</div>
<div class="modal-button-container modal-footer">
    <div class="always-show-zoom-buttons">
        <input
            type="checkbox"
            on:change={(e) => {
                plugin.settings.dispatch({
                    type: 'settings/view/set-always-show-zoom-button',
                    payload: {
                        alwaysShowZoomButtons: e.currentTarget.checked,
                    },
                });
            }}
            checked={$alwaysShowZoomButtons}
        />

        <span>{lang.controls_modal_always_show_zoom_buttons}</span>
    </div>
    <button class="mod-cta" on:click={close}>Done</button>
</div>

<style>
    .buttons-list {
        display: flex;
        flex-direction: column;

        & button {
            background-color: transparent;
            cursor: initial;
        }
    }

    .button-list-item {
        display: flex;
        gap: 5px;
        align-items: center;
        border-top: 1px solid var(--background-modifier-border);
        padding: 6px 14px;
    }
    .button-list-item:first-child {
        border-top: none;
    }

    .toolbar-icon-label {
        color: var(--text-normal);
    }

    .always-show-zoom-buttons {
        padding: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .modal-footer {
        justify-content: space-between;
        padding-left: 10px;
    }
</style>
