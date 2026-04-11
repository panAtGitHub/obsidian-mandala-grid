<script lang="ts">
    import type { NodeStyle } from 'src/mandala-settings/state/types/style-rules-types';
    import type { CellScrollbarMode } from 'src/mandala-cell/model/cell-scrollbar-mode';
    import Content from 'src/mandala-cell/view/content/content.svelte';
    import InlineEditor from 'src/mandala-cell/view/content/inline-editor.svelte';

    export let nodeId: string;
    export let style: NodeStyle | undefined;
    export let showInlineEditor = false;
    export let showContent = true;
    export let hideBuiltInHiddenInfo = false;
    export let fontSizeOffset: number | undefined;
    export let absoluteFontSize: number | undefined;
    export let scrollbarMode: CellScrollbarMode = 'interaction';
    export let fillContent = false;
    export let density: 'normal' | 'compact' = 'normal';
    export let isMobilePlatform = false;
    export let idleScrollbarEnabled = true;
    export let activateNode: (event: MouseEvent) => void = () => {};
    export let enableEditMode: () => void = () => {};
    export let onMobilePreviewDoubleTapEdit:
        | ((nodeId: string) => void)
        | null = null;
</script>

{#if showInlineEditor}
    <InlineEditor
        {nodeId}
        {style}
        {fontSizeOffset}
        {absoluteFontSize}
        {fillContent}
        {density}
    />
{:else if showContent}
    <Content
        {nodeId}
        {hideBuiltInHiddenInfo}
        {scrollbarMode}
        {fillContent}
        {density}
        {isMobilePlatform}
        {idleScrollbarEnabled}
        {activateNode}
        {enableEditMode}
        {onMobilePreviewDoubleTapEdit}
    />
{/if}
