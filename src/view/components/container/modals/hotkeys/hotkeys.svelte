<script lang="ts">
    import Group from './group.svelte';
    import Front from './front.svelte';
    import NumberOfConflicts from './status-bar.svelte';
    import { FilteredHotkeysStore } from '../../../../../stores/settings/derived/view-hotkeys-store';
    import { getView } from '../../context';
    import {
        DynamicLabelState
    } from 'src/view/components/container/modals/hotkeys/components/helpers/get-dynamic-label';
    import { OutlineModeStore } from '../../../../../stores/settings/derived/view-settings-store';

    import { X, Check } from 'lucide-svelte';
    import { Platform } from 'obsidian';

    const view = getView();
    const store = FilteredHotkeysStore(view);
    const outlineMode = OutlineModeStore(view);
    let labelState: DynamicLabelState;
    $: {
        labelState = {
            outlineMode: $outlineMode,
        };
    }

    const closeHotkeys = () => {
        view.viewStore.dispatch({ type: 'view/hotkeys/toggle-modal' });
    };

    const isMobile = Platform.isMobile;
</script>

<div 
    class="mandala-modal mandala-modal--full-height hotkeys-modal"
    class:is-mobile={isMobile}
    on:mousedown|stopPropagation
    on:touchstart|stopPropagation
>
    {#if isMobile}
        <div class="hotkeys-mobile-header">
            <div class="hotkeys-mobile-sheet-handle" aria-hidden="true" />
            <div class="hotkeys-mobile-header-row">
                <div class="hotkeys-mobile-title">快捷键</div>
                <button class="hotkeys-mobile-done-button" on:click={closeHotkeys}>
                    <Check size={18} />
                    <span>完成</span>
                </button>
            </div>
        </div>
        <Front />
    {:else}
        <div class="hotkeys-desktop-header mandala-modal-header-inline">
            <div class="hotkeys-desktop-header__search mandala-modal-header-inline__main">
                <Front />
            </div>
            <button
                class="modal-close-button hotkeys-desktop-close mandala-modal-close-inline"
                on:click={closeHotkeys}
                aria-label="关闭快捷键"
            >
                <X size={14} />
            </button>
        </div>
    {/if}
    <div class="groups">
        {#each Object.entries($store.hotkeys) as [groupName, group] (groupName)}
            <Group {groupName} {group} {labelState} />
        {/each}
    </div>
    <NumberOfConflicts conflicts={$store.numberOfConflictingHotkeys}/>
</div>

<style>
    :global(.is-mobile) .hotkeys-modal {
        left: 12px;
        right: 12px;
        top: calc(env(safe-area-inset-top, 0px) + 12px);
        bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
        width: auto;
        height: auto;
        max-width: none;
        max-height: none;
        padding: 0;
        border-radius: 20px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22),
            0 4px 12px rgba(0, 0, 0, 0.12);
        overflow: hidden;
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
    }

    .hotkeys-mobile-sheet-handle {
        width: 36px;
        height: 4px;
        border-radius: 999px;
        background: var(--background-modifier-border);
        margin: 6px auto 8px;
    }

    .hotkeys-mobile-header {
        display: flex;
        flex-direction: column;
        padding-top: calc(env(safe-area-inset-top, 12px) + 6px);
        padding-bottom: 10px;
        padding-left: 12px;
        padding-right: 12px;
        border-bottom: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        position: sticky;
        top: 0;
        z-index: 10;
        width: 100%;
    }

    .hotkeys-mobile-header-row {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        min-height: 28px;
    }

    .hotkeys-mobile-title {
        font-weight: 600;
        color: var(--text-normal);
    }

    .hotkeys-mobile-done-button {
        display: flex;
        align-items: center;
        gap: 4px;
        background: transparent;
        color: var(--interactive-accent);
        border: none;
        border-radius: 999px;
        padding: 6px 10px;
        font-weight: var(--font-semibold);
        cursor: pointer;
        transition: opacity 0.2s;
        position: absolute;
        right: 0;

        &:hover {
            opacity: 0.9;
        }
    }

    .groups {
        width: 500px;
        display: flex;
        flex-direction: column;
        gap: var(--size-4-2);
        overflow-y: auto;
        flex: 1;
    }

    .hotkeys-modal:not(.is-mobile) {
        z-index: 1200;
    }

    .hotkeys-desktop-header__search {
        flex: 1 1 auto;
        min-width: 0;
    }

    .hotkeys-desktop-header__search :global(.front) {
        width: 100%;
    }

    .hotkeys-desktop-close {
        margin-top: 0;
    }

    @media (max-width: 720px) {
        .groups {
            width: 100%;
            padding: var(--size-4-4) var(--size-4-6);
        }
    }
</style>
