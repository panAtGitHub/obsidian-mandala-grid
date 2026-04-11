<style>
    :global(.mandala-idle-scrollbar) {
        --mandala-idle-scrollbar-size: 6px;
        --mandala-overlay-scrollbar-track-color: transparent;
        --mandala-overlay-scrollbar-thumb-color: transparent;
        overflow-y: auto;
        overflow-x: hidden;
        position: relative;
        scrollbar-width: none;
        -ms-overflow-style: none;
        background-image:
            linear-gradient(
                to bottom,
                var(--mandala-overlay-scrollbar-track-color),
                var(--mandala-overlay-scrollbar-track-color)
            ),
            linear-gradient(
                to bottom,
                var(--mandala-overlay-scrollbar-thumb-color),
                var(--mandala-overlay-scrollbar-thumb-color)
            );
        background-repeat: no-repeat, no-repeat;
        background-size:
            var(--mandala-idle-scrollbar-size) 100%,
            var(--mandala-idle-scrollbar-size)
                var(--mandala-overlay-scrollbar-thumb-height, 0px);
        background-position:
            right top,
            right var(--mandala-overlay-scrollbar-thumb-offset, 0px);
    }

    :global(.mandala-idle-scrollbar::-webkit-scrollbar) {
        width: 0;
        height: 0;
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--hidden) {
        scrollbar-width: none;
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--hidden::-webkit-scrollbar) {
        width: 0;
        height: 0;
    }

    :global(.mandala-idle-scrollbar.has-overlay-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible),
    :global(.mandala-idle-scrollbar.has-overlay-scrollbar.cell-scrollbar-mode--selected-hover) {
        --mandala-overlay-scrollbar-track-color: color-mix(
            in srgb,
            var(--background-modifier-hover) 45%,
            transparent
        );
        --mandala-overlay-scrollbar-thumb-color: color-mix(
            in srgb,
            var(--text-muted) 70%,
            transparent
        );
    }

    :global(.mandala-idle-scrollbar.has-overlay-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible:hover),
    :global(.mandala-idle-scrollbar.has-overlay-scrollbar.cell-scrollbar-mode--selected-hover:hover) {
        --mandala-overlay-scrollbar-thumb-color: color-mix(
            in srgb,
            var(--text-normal) 70%,
            transparent
        );
    }
</style>
