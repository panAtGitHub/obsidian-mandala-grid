<script lang="ts">
    import type { NodeStyle } from 'src/mandala-settings/state/types/style-rules-types';
    import type { CellScrollbarMode } from 'src/mandala-cell/model/cell-scrollbar-mode';
    import Content from 'src/mandala-cell/view/content/content.svelte';
    import InlineEditor from 'src/mandala-cell/view/content/inline-editor.svelte';

    export let nodeId: string;
    export let style: NodeStyle | undefined;
    export let isInSidebar = false;
    export let showInlineEditor = false;
    export let showContent = true;
    export let hideBuiltInHiddenInfo = false;
    export let fontSizeOffset: number | undefined;
    export let absoluteFontSize: number | undefined;
    export let scrollbarMode: CellScrollbarMode = 'selected-hover';
    export let fillContent = false;
    export let density: 'normal' | 'compact' = 'normal';
</script>

{#if showInlineEditor}
    <InlineEditor
        {nodeId}
        {style}
        {fontSizeOffset}
        {absoluteFontSize}
        {fillContent}
    />
{:else if showContent}
    <Content
        {nodeId}
        {isInSidebar}
        {hideBuiltInHiddenInfo}
        {scrollbarMode}
        {fillContent}
        {density}
    />
{/if}
