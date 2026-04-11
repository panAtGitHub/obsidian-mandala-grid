<style>
    :global(.mandala-idle-scrollbar) {
        --mandala-idle-scrollbar-size: 6px;
        overflow-y: auto;
        overflow-x: hidden;
        position: relative;
        scrollbar-gutter: stable;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
    }

    :global(.mandala-idle-scrollbar::-webkit-scrollbar) {
        width: var(--mandala-idle-scrollbar-size);
        height: var(--mandala-idle-scrollbar-size);
    }

    :global(.mandala-idle-scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }

    :global(.mandala-idle-scrollbar::-webkit-scrollbar-thumb) {
        background: transparent;
        border-radius: 999px;
        border: 1px solid transparent;
        background-clip: padding-box;
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--hidden) {
        scrollbar-width: none;
        scrollbar-gutter: auto;
        -ms-overflow-style: none;
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--hidden::-webkit-scrollbar) {
        width: 0;
        height: 0;
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible),
    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--selected-hover:hover),
    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--selected-hover:focus-within) {
        scrollbar-color: color-mix(
            in srgb,
            var(
                    --mandala-overlay-scrollbar-track-base,
                    var(--background-modifier-hover)
                )
                45%,
            transparent
        )
            color-mix(
            in srgb,
            var(
                    --mandala-overlay-scrollbar-thumb-base,
                    var(--text-muted)
                )
                70%,
            transparent
        );
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible::-webkit-scrollbar-track),
    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--selected-hover:hover::-webkit-scrollbar-track),
    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--selected-hover:focus-within::-webkit-scrollbar-track) {
        background: color-mix(
            in srgb,
            var(
                    --mandala-overlay-scrollbar-track-base,
                    var(--background-modifier-hover)
                )
                45%,
            transparent
        );
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible::-webkit-scrollbar-thumb),
    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--selected-hover:hover::-webkit-scrollbar-thumb),
    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--selected-hover:focus-within::-webkit-scrollbar-thumb) {
        background: color-mix(
            in srgb,
            var(
                    --mandala-overlay-scrollbar-thumb-base,
                    var(--text-muted)
                )
                70%,
            transparent
        );
    }

    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible:hover::-webkit-scrollbar-thumb),
    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--selected-hover:hover::-webkit-scrollbar-thumb) {
        background: color-mix(
            in srgb,
            var(
                    --mandala-overlay-scrollbar-thumb-hover-base,
                    var(--text-normal)
                )
                70%,
            transparent
        );
    }
</style>
