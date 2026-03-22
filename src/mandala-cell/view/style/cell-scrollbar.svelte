<style>
    /* 默认状态：保留滚动能力，但把滚动条和轨道都压到透明，避免干扰卡片内容。 */
    :global(.mandala-idle-scrollbar) {
        --mandala-idle-scrollbar-thumb: var(--color-base-30);
        --mandala-idle-scrollbar-thumb-active: var(--color-base-40);
        --mandala-idle-scrollbar-size: 2px;
        overflow: auto;
        overflow: overlay;
        scrollbar-gutter: stable;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
        --scrollbar-thumb-bg: transparent !important;
        --scrollbar-active-thumb-bg: transparent !important;
        --scrollbar-bg: transparent !important;
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
    }

    /* 交互状态：当滚动条需要显式出现时，恢复细滚动条和可见的拇指颜色。 */
    :global(.mandala-idle-scrollbar.is-scrollbar-visible),
    :global(.mandala-card.active-node .mandala-idle-scrollbar),
    :global(.mandala-card.node-border--selected .mandala-idle-scrollbar),
    :global(.mandala-card:hover .mandala-idle-scrollbar) {
        scrollbar-width: thin;
        scrollbar-color: var(--mandala-idle-scrollbar-thumb) transparent;
        --scrollbar-thumb-bg: var(--mandala-idle-scrollbar-thumb) !important;
        --scrollbar-active-thumb-bg: var(
            --mandala-idle-scrollbar-thumb-active
        ) !important;
        --scrollbar-bg: transparent !important;
    }

    /* WebKit 兼容分支：单独控制滚动条尺寸，避免在不同浏览器里出现跳变。 */
    :global(.mandala-idle-scrollbar.is-scrollbar-visible::-webkit-scrollbar),
    :global(
            .mandala-card.active-node .mandala-idle-scrollbar::-webkit-scrollbar
        ),
    :global(
            .mandala-card.node-border--selected
                .mandala-idle-scrollbar::-webkit-scrollbar
        ),
    :global(.mandala-card:hover .mandala-idle-scrollbar::-webkit-scrollbar) {
        width: var(--mandala-idle-scrollbar-size);
        height: var(--mandala-idle-scrollbar-size);
    }

    :global(
            .mandala-idle-scrollbar.is-scrollbar-visible::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card.active-node
                .mandala-idle-scrollbar::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card.node-border--selected
                .mandala-idle-scrollbar::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card:hover .mandala-idle-scrollbar::-webkit-scrollbar-thumb
        ) {
        background: var(--mandala-idle-scrollbar-thumb);
    }

    /* 激活态：鼠标继续悬停时，使用更深的颜色强调正在交互。 */
    :global(
            .mandala-idle-scrollbar.is-scrollbar-visible:hover::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card.active-node
                .mandala-idle-scrollbar:hover::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card.node-border--selected
                .mandala-idle-scrollbar:hover::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card:hover
                .mandala-idle-scrollbar:hover::-webkit-scrollbar-thumb
        ) {
        background: var(--mandala-idle-scrollbar-thumb-active);
    }
</style>
