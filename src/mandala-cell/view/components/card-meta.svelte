<script lang="ts">
    import SectionMeta from 'src/mandala-cell/view/section-meta.svelte';
    import type { CellTextTone } from 'src/mandala-cell/model/card-types';

    export let displaySection: string;
    export let showSectionBackground = false;
    export let showSectionPin = false;
    export let showSectionColorDot = false;
    export let capsuleTextTone: CellTextTone | null = null;
    export let metaStyle: string | undefined;
    export let density: 'normal' | 'compact' = 'normal';
</script>

<SectionMeta
    sectionLabel={displaySection}
    showBackground={showSectionBackground}
    showPin={showSectionPin}
    showColorDot={showSectionColorDot}
    textTone={capsuleTextTone}
    style={metaStyle}
    className="mandala-card-meta"
    {density}
/>
