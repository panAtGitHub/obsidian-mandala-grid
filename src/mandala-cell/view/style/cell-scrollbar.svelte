<style>
    :global(.mandala-idle-scrollbar) {
        --mandala-idle-scrollbar-size: 8px;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-gutter: stable;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
        --scrollbar-thumb-bg: transparent;
        --scrollbar-active-thumb-bg: transparent;
        --scrollbar-bg: transparent;
        position: relative;
    }

    :global(.mandala-idle-scrollbar::-webkit-scrollbar) {
        width: var(--mandala-idle-scrollbar-size);
        height: var(--mandala-idle-scrollbar-size);
    }

    :global(.mandala-idle-scrollbar::-webkit-scrollbar-thumb) {
        background: transparent;
        border-radius: 999px;
    }

    :global(.mandala-idle-scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible) {
        scrollbar-color: color-mix(in srgb, var(--text-muted) 70%, transparent)
            transparent;
        --scrollbar-thumb-bg: color-mix(
            in srgb,
            var(--text-muted) 70%,
            transparent
        );
        --scrollbar-active-thumb-bg: color-mix(
            in srgb,
            var(--text-normal) 70%,
            transparent
        );
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible::-webkit-scrollbar-thumb) {
        background: color-mix(in srgb, var(--text-muted) 70%, transparent);
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible::-webkit-scrollbar-thumb:hover) {
        background: color-mix(in srgb, var(--text-normal) 70%, transparent);
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--hidden) {
        scrollbar-width: none;
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--hidden::-webkit-scrollbar) {
        width: 0;
        height: 0;
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--selected-hover) {
        scrollbar-color: color-mix(in srgb, var(--text-muted) 70%, transparent)
            transparent;
        --scrollbar-thumb-bg: color-mix(
            in srgb,
            var(--text-muted) 70%,
            transparent
        );
        --scrollbar-active-thumb-bg: color-mix(
            in srgb,
            var(--text-normal) 70%,
            transparent
        );
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--selected-hover::-webkit-scrollbar-thumb) {
        background: color-mix(in srgb, var(--text-muted) 70%, transparent);
    }
</style>
