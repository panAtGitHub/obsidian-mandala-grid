<script lang="ts">
    import type { NodeStyle } from 'src/stores/settings/types/style-rules-types';
    import Content from 'src/cell/display/content/content.svelte';
    import InlineEditor from 'src/cell/display/content/inline-editor.svelte';

    export let nodeId: string;
    export let style: NodeStyle | undefined;
    export let isInSidebar = false;
    export let showInlineEditor = false;
    export let showContent = true;
    export let fontSizeOffset: number | undefined;
    export let absoluteFontSize: number | undefined;
</script>

{#if showInlineEditor}
    <InlineEditor
        {nodeId}
        {style}
        {fontSizeOffset}
        {absoluteFontSize}
    />
{:else if showContent}
    <Content {nodeId} {isInSidebar} />
{/if}
