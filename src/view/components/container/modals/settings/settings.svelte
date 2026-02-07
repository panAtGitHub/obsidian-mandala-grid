<script lang="ts">
    import { renderSettings, SettingsTab } from '../../../../actions/settings/render-settings';
    import VerticalTabHeader from './vertical-tab-header.svelte';
    import { ActiveSettingsTabStore } from 'src/view/components/container/modals/settings/active-settings-tab-store';
    import { X, Check } from 'lucide-svelte';
    import { getView } from '../../context';
    import type { MandalaView } from 'src/view/view';
    import { Platform } from 'obsidian';

    const view = getView();

    const setActiveTab = (tab: SettingsTab) => {
        ActiveSettingsTabStore.set(tab);
    };

    const closeSettings = () => {
        view.viewStore.dispatch({ type: 'view/settings/toggle-modal' });
    };

    const isMobile = Platform.isMobile;
</script>

<div 
    class="mandala-modal" 
    id="mandala-view-settings" 
    tabindex="0" 
    class:is-mobile={isMobile}
    on:mousedown|stopPropagation
    on:touchstart|stopPropagation
>
    {#if isMobile}
        <div class="mobile-modal-header">
            <div class="mobile-modal-title">Settings</div>
            <button class="mobile-done-button" on:click={closeSettings}>
                <Check size={18} />
                <span>Done</span>
            </button>
        </div>
    {:else}
        <button class="modal-close-button" on:click={closeSettings} aria-label="Close settings">
            <X size={18} />
        </button>
    {/if}
    <div class="mandala-vertical-tabs-container">
        <VerticalTabHeader {setActiveTab} activeTab={$ActiveSettingsTabStore} />
        <div
            class="mandala-vertical-tab-content"
            use:renderSettings={$ActiveSettingsTabStore}
        ></div>
    </div>
</div>

<style>
    .mandala-vertical-tabs-container {
        display: flex;
        flex: 1;
        overflow: hidden;
    }
    .mandala-vertical-tab-content {
        height: auto;
        display: grid;
        flex-direction: column;
        width: 500px;
        overflow-y: auto;
        padding: var(--size-4-8) var(--size-4-12) var(--size-4-12);

        grid-template-areas: 'main';
        & > div {
            grid-area: main;
        }
    }

    .is-mobile {
        & .mandala-vertical-tabs-container {
            flex-direction: column;
            width: 100%;
        }

        & .mandala-vertical-tab-content {
            width: 100%;
            padding: var(--size-4-4) var(--size-4-8);
            flex: 1;
            overflow-x: hidden;
            /* 字体对齐逻辑已移至全局 modal.css 以获得更高优先级 */
        }
    }

    .mobile-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: calc(env(safe-area-inset-top, 20px) + var(--size-4-2)); /* 适配刘海屏/状态栏 */
        padding-bottom: var(--size-4-4);
        padding-left: var(--size-4-6);
        padding-right: var(--size-4-6);
        border-bottom: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .mobile-modal-title {
        font-weight: var(--font-bold);
        color: var(--text-normal);
    }

    .mobile-done-button {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--interactive-accent);
        color: white;
        border: none;
        border-radius: var(--radius-m);
        padding: 6px 14px;
        font-weight: var(--font-semibold);
        cursor: pointer;
        transition: opacity 0.2s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);

        &:hover {
            opacity: 0.9;
        }
    }

</style>
