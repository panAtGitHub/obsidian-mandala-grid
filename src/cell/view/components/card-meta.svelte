<script lang="ts">
    import SectionMeta from 'src/cell/view/section-meta.svelte';
    import type { CellTextTone } from 'src/cell/model/card-types';

    export let displaySection: string;
    export let showSectionBackground = false;
    export let showSectionPin = false;
    export let showSectionColorDot = false;
    export let capsuleTextTone: CellTextTone | null = null;
    export let metaStyle: string | undefined;
</script>

<SectionMeta
    sectionLabel={displaySection}
    showBackground={showSectionBackground}
    showPin={showSectionPin}
    showColorDot={showSectionColorDot}
    textTone={capsuleTextTone}
    style={metaStyle}
    className="mandala-card-meta"
/>
