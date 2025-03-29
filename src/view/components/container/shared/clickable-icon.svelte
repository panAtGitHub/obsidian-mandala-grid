<script lang="ts">
    import type { MouseEventHandler } from 'svelte/elements';

    export let onClick: MouseEventHandler<any>;
    export let label: string;
    export let isActive = false;
    export let hasEnabledItems = false;
    export let disabled = false;
</script>

<button
    aria-label={label}
    class={'clickable-icon nav-action-button ' +
        (isActive ? 'clickable-icon--active ' : '')}
    {disabled}
    on:click={onClick}
    style="position:relative"
>
    {#if hasEnabledItems}
        <span class="asterisk">*</span>
    {/if}
    <slot />
</button>

<style>
    .asterisk {
        position: absolute;
        top: 1px;
        right: 1px;
        opacity: 0.8;
    }

    :global(.theme-dark) {
        & .clickable-icon {
            color: var(--color-base-60);
        }
        & .clickable-icon:active {
            color: var(--icon-color-active);
        }
    }
    :global(.theme-light) {
        & .lineage-view .sidebar-tabs-header .clickable-icon {
            color: var(--color-base-10);
        }
        & .lineage-view .sidebar-tabs-header .clickable-icon:active {
            color: var(--color-base-10);
        }
    }
    .clickable-icon--active {
        color: var(--icon-color-active);
        background-color: rgba(0, 0, 0, 0.3); /* Slightly darker overlay */
        background-blend-mode: multiply;
    }
</style>
