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
