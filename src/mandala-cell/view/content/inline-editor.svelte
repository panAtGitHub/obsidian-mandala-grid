<script lang="ts">
    import { NodeId } from 'src/mandala-document/state/document-state-type';
    import { loadInlineEditor } from 'src/view/actions/inline-editor/load-inline-editor';
    import { expandableTextareaAction } from 'src/view/actions/inline-editor/expandable-textarea-action';
    import { NodeStyle } from 'src/mandala-settings/state/types/style-rules-types';

    export let nodeId: NodeId;
    export let style: NodeStyle | undefined;
    export let fontSizeOffset: number = 0;
    export let absoluteFontSize: number | undefined = undefined;
    export let disableAutoResize: boolean = false;
</script>

<div
    class={'editor-container' + (style ? ' apply-style-rule' : '')}
    style="--local-font-size-offset: {absoluteFontSize ? 0 : fontSizeOffset}px; {absoluteFontSize ? `--font-text-size: ${absoluteFontSize}px; font-size: ${absoluteFontSize}px;` : ''}"
    use:loadInlineEditor={nodeId}
    use:expandableTextareaAction={!disableAutoResize}
></div>

<style>
    .editor-container {
        width: 100%;
        min-width: 0;
        min-height: var(--min-node-height);
        height: fit-content;
        overflow: hidden;
        display: flex;
        box-sizing: border-box;
    }

    .apply-style-rule {
        & .view-content {
            background-color: transparent !important;
        }
    }
</style>
