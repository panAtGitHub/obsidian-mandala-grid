<script lang="ts">
    import clx from 'classnames';
    import { Lock } from 'lucide-svelte';
    import type { CellTextTone } from 'src/cell/model/card-types';

    export let sectionLabel = '';
    export let showPin = false;
    export let showColorDot = false;
    export let showBackground = false;
    export let textTone: CellTextTone | null = null;
    export let style: string | undefined;
    export let className = '';
</script>

<div
    class={clx(
        className,
        'section-meta',
        showBackground ? 'section-meta--with-bg' : 'section-meta--without-bg',
        showBackground && textTone
            ? `section-meta--tone-${textTone}`
            : undefined,
    )}
    style={style}
>
    {#if showColorDot}
        <span class="section-meta__color-dot" aria-hidden="true"></span>
    {/if}
    {#if showPin}
        <span class="section-meta__lock" aria-hidden="true">
            <Lock size={10} strokeWidth={2.2} />
        </span>
    {/if}
    <span class="section-meta__label">{sectionLabel}</span>
</div>

<style>
    .section-meta {
        position: absolute;
        top: 8px;
        right: 8px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        user-select: none;
        pointer-events: none;
        z-index: 1;
    }

    .section-meta--with-bg {
        min-height: 18px;
        padding: 1px 6px;
        border-radius: 6px;
        background: var(--mandala-card-meta-bg);
        color: var(--text-muted);
    }

    .section-meta--without-bg {
        opacity: 0.7;
    }

    .section-meta__color-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--mandala-card-meta-accent, currentColor);
        box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 16%, transparent);
        flex: 0 0 auto;
    }

    .section-meta__lock {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: currentColor;
        opacity: 0.9;
    }

    .section-meta__label {
        line-height: 1;
    }

    .section-meta--tone-dark {
        color: #2f3a48;
    }

    .section-meta--tone-light {
        color: #d0d8e6;
    }
</style>
