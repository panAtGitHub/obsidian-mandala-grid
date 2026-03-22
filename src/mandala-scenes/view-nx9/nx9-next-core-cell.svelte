<script lang="ts">
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { createNextNx9Core } from 'src/view/helpers/mandala/nx9/create-next-core';

    export let nextCoreSection: string;
    export let tone: 'accent' | 'muted' = 'accent';
    export let disabled = false;

    const view = getView();

    const handleClick = (event: MouseEvent) => {
        if (disabled) return;
        event.preventDefault();
        event.stopPropagation();
        createNextNx9Core(view, nextCoreSection);
    };
</script>

<button
    type="button"
    class="nx9-next-core-button"
    class:nx9-next-core-button--muted={tone === 'muted'}
    aria-label={`创建核心 ${nextCoreSection}`}
    {disabled}
    on:click={handleClick}
>
    +
</button>

<style>
    .nx9-next-core-button {
        width: calc(68px * var(--nx9-future-scale, 1));
        height: calc(68px * var(--nx9-future-scale, 1));
        border: calc(3px * var(--nx9-future-scale, 1)) solid
            var(--interactive-accent, var(--text-accent));
        border-radius: 999px;
        background: color-mix(
            in srgb,
            var(--background-primary) 90%,
            var(--interactive-accent, var(--text-accent)) 10%
        );
        color: var(--interactive-accent, var(--text-accent));
        font-size: calc(34px * var(--nx9-future-scale, 1));
        font-weight: 600;
        line-height: 1;
        cursor: pointer;
        transition:
            transform 120ms ease,
            background 120ms ease;
    }

    .nx9-next-core-button--muted {
        border-color: color-mix(
            in srgb,
            var(--background-modifier-border) 78%,
            var(--text-faint) 22%
        );
        background: color-mix(
            in srgb,
            var(--background-primary) 94%,
            var(--background-modifier-border) 6%
        );
        color: var(--text-faint);
        cursor: default;
        opacity: 0.9;
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

    .nx9-next-core-button--muted:hover,
    .nx9-next-core-button--muted:focus-visible,
    .nx9-next-core-button:disabled {
        background: color-mix(
            in srgb,
            var(--background-primary) 94%,
            var(--background-modifier-border) 6%
        );
        transform: none;
        outline: none;
    }
</style>
