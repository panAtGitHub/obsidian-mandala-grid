<script lang="ts">
    import clx from 'classnames';
    import { Pin } from 'lucide-svelte';
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
        background: color-mix(
            in srgb,
            var(--mandala-card-meta-accent, currentColor) 22%,
            transparent
        );
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
