<script lang="ts">
    import clx from 'classnames';
    import { Lock } from 'lucide-svelte';
    import type { CellTextTone } from 'src/cell/model/card-types';

    export let displaySection: string;
    export let showSectionBackground = false;
    export let showSectionPin = false;
    export let showSectionColorDot = false;
    export let capsuleTextTone: CellTextTone | null = null;
    export let metaStyle: string | undefined;
</script>

<div
    class={clx(
        'mandala-card-meta',
        showSectionBackground
            ? 'mandala-card-meta--with-bg'
            : 'mandala-card-meta--without-bg',
        showSectionBackground && capsuleTextTone
            ? `mandala-card-meta--tone-${capsuleTextTone}`
            : undefined,
    )}
    style={metaStyle}
>
    {#if showSectionColorDot}
        <span class="mandala-card-meta__color-dot" aria-hidden="true"></span>
    {/if}
    {#if showSectionPin}
        <span class="mandala-card-meta__lock" aria-hidden="true">
            <Lock size={10} strokeWidth={2.2} />
        </span>
    {/if}
    <span class="mandala-card-meta__section">{displaySection}</span>
</div>
