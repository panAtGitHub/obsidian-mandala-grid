<script lang="ts">
    import clx from 'classnames';
    import { Pin } from 'lucide-svelte';
    import type { CellTextTone } from 'src/cell/model/card-types';

    // sectionLabel: 右上角显示的 section 编号，例如 1.4、81.4。
    export let sectionLabel = '';
    // showPin: 是否显示锁定图标。
    export let showPin = false;
    // showColorDot: 这里虽然沿用旧名字，但现在控制的是“是否启用胶囊包裹色块”。
    export let showColorDot = false;
    // showBackground: 是否使用旧的整块 section 胶囊背景模式。
    export let showBackground = false;
    // textTone: 当整块背景较深时，用它决定文字要偏深色还是浅色。
    export let textTone: CellTextTone | null = null;
    // style: 从外部传进来的 CSS 变量，主要用来承接 section 颜色。
    export let style: string | undefined;
    // className: 允许外部继续追加类名，方便不同格子视图复用。
    export let className = '';
</script>

<div
    class={clx(
        className,
        'mandala-card-meta',
        showColorDot && !showBackground
            ? 'mandala-card-meta--capsule-wrap'
            : undefined,
        showBackground
            ? 'mandala-card-meta--with-bg'
            : 'mandala-card-meta--without-bg',
        showBackground && textTone
            ? `mandala-card-meta--tone-${textTone}`
            : undefined,
    )}
    style={style}
>
    {#if showPin}
        <span class="mandala-card-meta__pin" aria-hidden="true">
            <Pin size={10} strokeWidth={2.2} />
        </span>
    {/if}
    <span class="mandala-card-meta__section">{sectionLabel}</span>
</div>

<style>
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

    .mandala-card-meta--with-bg {
        min-height: 18px;
        padding: 1px 6px;
        border-radius: 6px;
        background: var(--mandala-card-meta-bg);
        color: var(--text-muted);
    }

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

    .mandala-card-meta--tone-dark {
        color: #2f3a48;
    }

    .mandala-card-meta--tone-light {
        color: #d0d8e6;
    }
</style>
