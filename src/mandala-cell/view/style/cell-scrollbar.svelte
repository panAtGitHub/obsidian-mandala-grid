<style>
    /* 默认状态：保留原生滚动条，但不主动给它额外着色或加伪装提示。 */
    :global(.mandala-idle-scrollbar) {
        --mandala-idle-scrollbar-thumb: var(--color-base-30);
        --mandala-idle-scrollbar-thumb-active: var(--color-base-40);
        overflow: auto;
        overflow: overlay;
        scrollbar-gutter: auto;
        scrollbar-width: thin;
        position: relative;
    }

    /* interaction 模式保留给未来使用：当前不再额外改写原生滚动条外观。 */
    :global(.mandala-idle-scrollbar.cell-scrollbar-mode--interaction.is-scrollbar-visible) {
    }

    /* selected-hover 模式保留给未来使用：当前仅依赖系统原生滚动条。 */
    :global(.mandala-card:hover .mandala-idle-scrollbar.cell-scrollbar-mode--selected-hover) {
    }
</style>
