<script lang="ts">
    import { Settings } from 'lucide-svelte';
    import { Menu } from 'obsidian';
    import { lang } from '../../../../../lang/lang';
    import { getView } from '../../context';
    import {
        AltPrimaryModifier
    } from '../../../../actions/keyboard-shortcuts/helpers/commands/presets/alt-primary-modifier';

    export let conflicts: number;
    const view = getView();

    const showMenu = (e: MouseEvent) => {
        const menu = new Menu();
        menu.addItem((item) => {
            item.setTitle(lang.modals_hk_reset_hotkeys);

            item.onClick(() => {
                view.plugin.settings.dispatch({
                    type: 'settings/hotkeys/reset-all',
                });
            });
        });
        menu.addItem((item) => {
            item.setTitle(lang.modals_hk_load_alt_hotkeys_preset);
            item.onClick(() => {
                view.plugin.settings.dispatch({
                    type: 'settings/hotkeys/apply-preset',
                    payload: { preset: AltPrimaryModifier },
                });
            });
        });

        menu.showAtMouseEvent(e);
    };
</script>

<div class="hotkeys-status-bar">
    {#if conflicts}
        <span class="conflicts-indicator">
            {conflicts} 个快捷键存在冲突
        </span>
    {/if}
    <span class="hotkeys-menu" on:click={showMenu}>
        <Settings class="svg-icon" />
    </span>
</div>

<style>
    .hotkeys-status-bar {
        display: flex;
        align-items: center;
    }
    .conflicts-indicator {
        font-size: 12px;
        color: var(--color-red);
    }

    .hotkeys-menu {
        margin-left: auto;
        padding: 3px;
        cursor: pointer;
        transition: opacity ease 100ms;
        opacity: 0.7;
        & svg {
            width: 14px;
            height: 14px;
        }
        &:hover {
            opacity: 1;
        }
    }
</style>
