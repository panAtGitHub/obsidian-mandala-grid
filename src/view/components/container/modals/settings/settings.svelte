<script lang="ts">
    import { renderSettings, SettingsTab } from '../../../../actions/settings/render-settings';
    import VerticalTabHeader from './vertical-tab-header.svelte';
    import { ActiveSettingsTabStore } from 'src/view/components/container/modals/settings/active-settings-tab-store';
    import { X } from 'lucide-svelte';
    import { getView } from '../../context';
    import type { MandalaView } from 'src/view/view';

    const view = getView();

    const setActiveTab = (tab: SettingsTab) => {
        ActiveSettingsTabStore.set(tab);
    };

    const closeSettings = () => {
        view.viewStore.dispatch({ type: 'view/settings/toggle-modal' });
    };
</script>

<div class="mandala-modal" id="mandala-view-settings" tabindex="0">
    <button class="modal-close-button" on:click={closeSettings} aria-label="Close settings">
        <X size={18} />
    </button>
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
    }
    .mandala-vertical-tab-content {
        height: auto;
        display: grid;
        flex-direction: column;
        width: 500px;
        overflow-y: auto;
        padding-top: var(--size-4-8);
        padding-bottom: var(--size-4-12);
        padding-inline-start: var(--size-4-12);
        padding-inline-end: var(--size-4-12);

        grid-template-areas: 'main';
        & > div {
            grid-area: main;
        }
    }

    :global(.modal-close-button) {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 11;
        background: var(--background-modifier-hover);
        border: none;
        border-radius: var(--radius-s);
        padding: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        transition: all 0.15s ease;
    }

    :global(.modal-close-button:hover) {
        background: var(--background-modifier-border);
        color: var(--text-normal);
    }

</style>
