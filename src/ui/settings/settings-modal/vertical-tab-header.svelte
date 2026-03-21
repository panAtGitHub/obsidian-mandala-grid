<script lang="ts">
    import { SettingsTab } from '../../../../actions/settings/render-settings';
    import { Platform } from 'obsidian';

    export let setActiveTab : (tab: SettingsTab)=>void
    export let activeTab: SettingsTab
    const tabs: SettingsTab[] = ['General', 'Appearance', 'Layout']

    const isMobile = Platform.isMobile;

</script>

<div class="mandala-vertical-tab-header" class:is-mobile={isMobile}>
    <div class="vertical-tab-header-group">
        <div class="vertical-tab-header-group-items">
            {#each tabs as tab (tab)}
                <div
                    class={'vertical-tab-nav-item' +
                        (tab === activeTab ? ' is-active' : '')}
                    on:click={() => setActiveTab(tab)}
                >
                    {tab}
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .mandala-vertical-tab-header {
        width: 250px;
        padding: var(--size-4-3);
        background-color: var(--background-secondary);
    }

    .is-mobile {
        width: 100%;
        padding: var(--size-4-2) var(--size-4-4);
        background-color: var(--background-primary);
        border-bottom: 1px solid var(--background-modifier-border);

        & .vertical-tab-header-group-items {
            display: flex;
            background-color: var(--background-secondary-alt);
            border-radius: var(--radius-m);
            padding: 2px;
            gap: 2px;
        }

        & .vertical-tab-nav-item {
            flex: 1;
            text-align: center;
            padding: 10px 12px; /* 进一步增加点击高度 */
            border-radius: var(--radius-s);
            font-size: 17px !important; /* 解耦：固定像素值 */
            cursor: pointer;
            transition: all 0.2s ease;
            color: var(--text-muted);
            margin: 0;

            &.is-active {
                background-color: var(--background-primary);
                color: var(--text-normal);
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                font-weight: var(--font-semibold);
            }

            &:not(.is-active):hover {
                background-color: var(--background-modifier-hover);
            }
        }
    }
</style>
