<style>
    :global(.mandala-idle-scrollbar) {
        --mandala-idle-scrollbar-size: 6px;
        overflow-y: auto;
        overflow-x: hidden;
        position: relative;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    :global(.mandala-idle-scrollbar::-webkit-scrollbar) {
        width: 0;
        height: 0;
    }

    :global(.mandala-idle-scrollbar::before) {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: var(--mandala-idle-scrollbar-size);
        height: 100%;
        border-radius: 999px;
        background: transparent;
        pointer-events: none;
        opacity: 0;
        transition: opacity 120ms ease;
    }

    :global(.mandala-idle-scrollbar::after) {
        content: '';
        position: absolute;
        top: var(--mandala-overlay-scrollbar-thumb-offset, 0px);
        right: 0;
        width: var(--mandala-idle-scrollbar-size);
        height: var(--mandala-overlay-scrollbar-thumb-height, 0px);
        border-radius: 999px;
        background: color-mix(in srgb, var(--text-muted) 70%, transparent);
        pointer-events: none;
        opacity: 0;
        transition:
            opacity 120ms ease,
            background 120ms ease;
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--hidden) {
        scrollbar-width: none;
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--hidden::-webkit-scrollbar) {
        width: 0;
        height: 0;
    }

    :global(.mandala-idle-scrollbar.has-overlay-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible::after),
    :global(.mandala-idle-scrollbar.has-overlay-scrollbar.cell-scrollbar-mode--selected-hover::after) {
        opacity: 1;
    }

    :global(.mandala-idle-scrollbar.has-overlay-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible::before),
    :global(.mandala-idle-scrollbar.has-overlay-scrollbar.cell-scrollbar-mode--selected-hover::before) {
        opacity: 1;
        background: color-mix(in srgb, var(--background-modifier-hover) 45%, transparent);
    }

    :global(.mandala-idle-scrollbar.has-overlay-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible:hover::after),
    :global(.mandala-idle-scrollbar.has-overlay-scrollbar.cell-scrollbar-mode--selected-hover:hover::after) {
        background: color-mix(in srgb, var(--text-normal) 70%, transparent);
    }
</style>
