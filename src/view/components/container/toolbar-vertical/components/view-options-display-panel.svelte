<script lang="ts">
    import { Eye } from 'lucide-svelte';
    import { lang } from 'src/lang/lang';
    import type { DetailSidebarPreviewMode } from 'src/stores/settings/settings-type';

    export let show = false;
    export let showHiddenCardInfo = false;
    export let show3x3SubgridNavButtons = true;
    export let show9x9ParallelNavButtons = true;
    export let showCopyBlockPlain = true;
    export let showCopyBlockEmbed = true;
    export let showCopyHeadingPlain = true;
    export let showCopyHeadingEmbed = true;
    export let showCopyHeadingEmbedDollar = true;
    export let detailSidebarPreviewMode: DetailSidebarPreviewMode = 'rendered';

    export let toggle: () => void;
    export let toggleHiddenCardInfo: () => void;
    export let toggle3x3SubgridNavButtons: () => void;
    export let toggle9x9ParallelNavButtons: () => void;
    export let toggleCopyBlockPlain: () => void;
    export let toggleCopyBlockEmbed: () => void;
    export let toggleCopyHeadingPlain: () => void;
    export let toggleCopyHeadingEmbed: () => void;
    export let toggleCopyHeadingEmbedDollar: () => void;
    export let updateDetailSidebarPreviewMode: (
        mode: DetailSidebarPreviewMode,
    ) => void;
</script>

<button class="view-options-menu__item" on:click={toggle}>
    <div class="view-options-menu__icon">
        <Eye class="view-options-menu__icon-svg" size={18} />
    </div>
    <div class="view-options-menu__content">
        <div class="view-options-menu__label">显示选项</div>
        <div class="view-options-menu__desc">辅助信息与按钮显示</div>
    </div>
</button>

{#if show}
    <div class="view-options-menu__submenu">
        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">
                详情侧边栏预览
            </div>

            <div class="view-options-menu__row">
                <span>预览样式</span>
                <div class="view-options-menu__row-controls">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="radio"
                            name="detail-sidebar-preview-mode"
                            checked={detailSidebarPreviewMode === 'rendered'}
                            on:change={() =>
                                updateDetailSidebarPreviewMode('rendered')}
                        />
                        <span>渲染</span>
                    </label>
                    <label class="view-options-menu__inline-option">
                        <input
                            type="radio"
                            name="detail-sidebar-preview-mode"
                            checked={detailSidebarPreviewMode === 'source'}
                            on:change={() =>
                                updateDetailSidebarPreviewMode('source')}
                        />
                        <span>Markdown（只读）</span>
                    </label>
                </div>
            </div>

            <div class="view-options-menu__subsection-title">显示 / 隐藏</div>

            <div class="view-options-menu__row">
                <span>Anki 卡片辅助信息</span>
                <div class="view-options-menu__row-controls">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="checkbox"
                            checked={showHiddenCardInfo}
                            on:change={toggleHiddenCardInfo}
                        />
                        <span>{showHiddenCardInfo ? '显示中' : '已隐藏'}</span>
                    </label>
                </div>
            </div>

            <div class="view-options-menu__row">
                <span>3x3 视图导航按钮</span>
                <div class="view-options-menu__row-controls">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="checkbox"
                            checked={show3x3SubgridNavButtons}
                            on:change={toggle3x3SubgridNavButtons}
                        />
                        <span
                            >{show3x3SubgridNavButtons
                                ? '显示中'
                                : '已隐藏'}</span
                        >
                    </label>
                </div>
            </div>

            <div class="view-options-menu__row">
                <span>9x9 平行九宫格切换按钮</span>
                <div class="view-options-menu__row-controls">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="checkbox"
                            checked={show9x9ParallelNavButtons}
                            on:change={toggle9x9ParallelNavButtons}
                        />
                        <span
                            >{show9x9ParallelNavButtons
                                ? '显示中'
                                : '已隐藏'}</span
                        >
                    </label>
                </div>
            </div>

            <div class="view-options-menu__subsection-title">
                {lang.settings_display_context_menu_advanced}
            </div>

            <div class="view-options-menu__row">
                <span>{lang.settings_display_copy_block_link_plain}</span>
                <div class="view-options-menu__row-controls">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="checkbox"
                            checked={showCopyBlockPlain}
                            on:change={toggleCopyBlockPlain}
                        />
                        <span>{showCopyBlockPlain ? '显示中' : '已隐藏'}</span>
                    </label>
                </div>
            </div>

            <div class="view-options-menu__row">
                <span>{lang.settings_display_copy_block_link_embed}</span>
                <div class="view-options-menu__row-controls">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="checkbox"
                            checked={showCopyBlockEmbed}
                            on:change={toggleCopyBlockEmbed}
                        />
                        <span>{showCopyBlockEmbed ? '显示中' : '已隐藏'}</span>
                    </label>
                </div>
            </div>

            <div class="view-options-menu__row">
                <span>{lang.settings_display_copy_heading_link_plain}</span>
                <div class="view-options-menu__row-controls">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="checkbox"
                            checked={showCopyHeadingPlain}
                            on:change={toggleCopyHeadingPlain}
                        />
                        <span>{showCopyHeadingPlain ? '显示中' : '已隐藏'}</span
                        >
                    </label>
                </div>
            </div>

            <div class="view-options-menu__row">
                <span>{lang.settings_display_copy_heading_link_embed}</span>
                <div class="view-options-menu__row-controls">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="checkbox"
                            checked={showCopyHeadingEmbed}
                            on:change={toggleCopyHeadingEmbed}
                        />
                        <span>{showCopyHeadingEmbed ? '显示中' : '已隐藏'}</span
                        >
                    </label>
                </div>
            </div>

            <div class="view-options-menu__row">
                <span
                    >{lang.settings_display_copy_heading_link_embed_dollar}</span
                >
                <div class="view-options-menu__row-controls">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="checkbox"
                            checked={showCopyHeadingEmbedDollar}
                            on:change={toggleCopyHeadingEmbedDollar}
                        />
                        <span>
                            {showCopyHeadingEmbedDollar ? '显示中' : '已隐藏'}
                        </span>
                    </label>
                </div>
            </div>
        </div>
    </div>
{/if}
