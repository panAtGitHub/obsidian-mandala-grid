<script lang="ts">
    import SectionMeta from 'src/mandala-cell/view/section-meta.svelte';
    import type {
        CellSectionMetaVariant,
        CellTextTone,
    } from 'src/mandala-cell/model/card-types';

    export let displaySection: string;
    export let variant: CellSectionMetaVariant = 'plain';
    export let showSectionPin = false;
    export let textTone: CellTextTone | null = null;
    export let metaStyle: string | undefined;
    export let density: 'normal' | 'compact' = 'normal';
</script>

<SectionMeta
    sectionLabel={displaySection}
    {variant}
    showPin={showSectionPin}
    {textTone}
    style={metaStyle}
    className="mandala-card-meta"
    {density}
/>
