<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import { createNextNx9Core } from 'src/view/helpers/mandala/nx9/create-next-core';

    export let nextCoreSection: string;

    const view = getView();

    const handleClick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        createNextNx9Core(view, nextCoreSection);
    };
</script>

<button
    type="button"
    class="nx9-next-core-button"
    aria-label={`创建核心 ${nextCoreSection}`}
    on:click={handleClick}
>
    +
</button>

<style>
    .nx9-next-core-button {
        width: 56px;
        height: 56px;
        border: 3px solid var(--interactive-accent, var(--text-accent));
        border-radius: 999px;
        background: color-mix(
            in srgb,
            var(--background-primary) 90%,
            var(--interactive-accent, var(--text-accent)) 10%
        );
        color: var(--interactive-accent, var(--text-accent));
        font-size: 34px;
        font-weight: 600;
        line-height: 1;
        cursor: pointer;
        transition:
            transform 120ms ease,
            background 120ms ease;
    }

    .nx9-next-core-button:hover,
    .nx9-next-core-button:focus-visible {
        background: color-mix(
            in srgb,
            var(--background-primary) 78%,
            var(--interactive-accent, var(--text-accent)) 22%
        );
        transform: scale(1.03);
        outline: none;
    }
</style>
