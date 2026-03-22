<script lang="ts">
    import clx from 'classnames';
    import { Pin } from 'lucide-svelte';
    import type { CellTextTone } from 'src/cell/model/card-types';

    type SectionMetaVariant = 'plain' | 'capsule' | 'background';

    // 卡片右上角的元信息：section 编号，可选附带 pin 图标。
    export let sectionLabel = '';
    export let showPin = false;
    // 推荐由 ViewModel 直接给最终展示模式；旧布尔字段仍保留兼容。
    export let variant: SectionMetaVariant | null = null;
    // 旧字段名保留不动；这里实际控制的是彩色胶囊包裹样式。
    export let showColorDot = false;
    // 开启后走整块背景模式；否则使用轻量文本/胶囊模式。
    export let showBackground = false;
    // 整块背景较深时，用它切换文字明暗。
    export let textTone: CellTextTone | null = null;
    // 外部注入的 CSS 变量主要用于 section 相关配色。
    export let style: string | undefined;
    // 允许外部补充类名，便于不同卡片视图复用。
    export let className = '';

    // 优先使用显式 variant；未提供时再从旧参数推导。
    $: resolvedVariant = variant ?? getLegacyVariant(showBackground, showColorDot);
    $: metaClassName = clx(
        className,
        'mandala-card-meta',
        resolvedVariant === 'capsule'
            ? 'mandala-card-meta--capsule-wrap'
            : undefined,
        resolvedVariant === 'background'
            ? 'mandala-card-meta--with-bg'
            : 'mandala-card-meta--without-bg',
        resolvedVariant === 'background' && textTone
            ? `mandala-card-meta--tone-${textTone}`
            : undefined,
    );

    function getLegacyVariant(
        showBackground: boolean,
        showColorDot: boolean,
    ): SectionMetaVariant {
        if (showBackground) return 'background';
        if (showColorDot) return 'capsule';
        return 'plain';
    }
</script>

<!-- ViewModel 给出最终展示模式后，这里只负责渲染对应的 meta 外观。 -->
<div class={metaClassName} style={style}>
    {#if showPin}
        <span class="mandala-card-meta__pin" aria-hidden="true">
            <Pin size={10} strokeWidth={2.2} />
        </span>
    {/if}
    <span class="mandala-card-meta__section">{sectionLabel}</span>
</div>

<style>
    /* 右上角定位的元信息容器，不参与鼠标事件，避免挡住卡片交互。 */
    .mandala-card-meta {
        position: absolute;
        top: 6px;
        right: 8px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        user-select: none;
        pointer-events: none;
        z-index: 1;
    }

    /* 旧版整块背景样式。 */
    .mandala-card-meta--with-bg {
        min-height: 18px;
        padding: 1px 6px;
        border-radius: 6px;
        background: var(--mandala-card-meta-bg);
        color: var(--text-muted);
    }

    /* 当前主用的彩色胶囊样式。 */
    .mandala-card-meta--capsule-wrap {
        min-height: 18px;
        padding: 1px 8px;
        border-radius: 999px;
        background: var(--mandala-card-meta-accent, currentColor);
        color: color-mix(
            in srgb,
            var(--mandala-card-meta-accent, currentColor) 75%,
            var(--text-normal) 25%
        );
        opacity: 1;
    }

    /* 无背景时只保留轻量文字感。 */
    .mandala-card-meta--without-bg {
        opacity: 0.7;
    }

    .mandala-card-meta__pin {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: currentColor;
        opacity: 0.9;
    }

    .mandala-card-meta__section {
        line-height: 1;
    }

    /* 深浅文字 tone 只在整块背景模式下使用。 */
    .mandala-card-meta--tone-dark {
        color: #2f3a48;
    }

    .mandala-card-meta--tone-light {
        color: #d0d8e6;
    }
</style>
