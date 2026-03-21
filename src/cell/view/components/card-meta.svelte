<script lang="ts">
    import clx from 'classnames';
    import { Pin } from 'lucide-svelte';
    import type { CellTextTone } from 'src/cell/model/card-types';

    export let displaySection: string;
    export let showSectionBackground = false;
    export let showSectionPin = false;
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
    {#if showSectionPin}
        <span class="mandala-card-meta__pin" aria-hidden="true">
            <Pin size={10} strokeWidth={2.2} />
        </span>
    {/if}
    <span class="mandala-card-meta__section">{displaySection}</span>
</div>
