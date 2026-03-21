<script lang="ts">
    import type { MouseEventHandler } from 'svelte/elements';

    export let onClick: MouseEventHandler<any>;
    export let label: string;
    export let isActive = false;
</script>

<button
    aria-label={label}
    class={'clickable-icon nav-action-button ' +
        (isActive ? 'clickable-icon--active ' : '')}
    on:click={onClick}
    style="position:relative"
>
    <slot />
</button>

<style>
    :global(.mandala-view) .clickable-icon {
        cursor: pointer;
    }

    :global(.theme-dark) {
        & .mandala-view .sidebar-tabs-header .clickable-icon {
            color: var(--color-base-60);
        }
        & .mandala-view .sidebar-tabs-header .clickable-icon:active {
            color: var(--icon-color-active);
        }
    }
    :global(.theme-light) {
        & .mandala-view .sidebar-tabs-header .clickable-icon {
            color: var(--color-base-10);
        }
        & .mandala-view .sidebar-tabs-header .clickable-icon:active {
            color: var(--color-base-10);
        }
    }
    .clickable-icon--active {
        color: var(--icon-color-active);
        background-color: rgba(0, 0, 0, 0.3); /* Slightly darker overlay */
        background-blend-mode: multiply;
    }
</style>
