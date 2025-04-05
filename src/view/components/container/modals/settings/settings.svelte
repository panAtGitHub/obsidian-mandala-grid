<script lang="ts">
    import { renderSettings, SettingsTab } from '../../../../actions/settings/render-settings';
    import VerticalTabHeader from './vertical-tab-header.svelte';
    import { ActiveSettingsTabStore } from 'src/view/components/container/modals/settings/active-settings-tab-store';

    const setActiveTab = (tab: SettingsTab) => {
        ActiveSettingsTabStore.set(tab);
    };
</script>

<div class="lineage-modal" id="lineage-view-settings" tabindex="0">
    <div class="lineage-vertical-tabs-container">
        <VerticalTabHeader {setActiveTab} activeTab={$ActiveSettingsTabStore} />
        <div
            class="lineage-vertical-tab-content"
            use:renderSettings={$ActiveSettingsTabStore}
        ></div>
    </div>
</div>

<style>
    .lineage-vertical-tabs-container {
        display: flex;
    }
    .lineage-vertical-tab-content {
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


</style>
