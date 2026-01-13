<script lang="ts">
    import { NodeId } from 'src/stores/document/document-state-type';
    import { loadInlineEditor } from 'src/view/actions/inline-editor/load-inline-editor';
    import { expandableTextareaAction } from 'src/view/actions/inline-editor/expandable-textarea-action';
    import { NodeStyle } from 'src/stores/settings/types/style-rules-types';

    export let nodeId: NodeId;
    export let style: NodeStyle | undefined;
    export let fontSizeOffset: number = 0;
</script>

<div
    class={'editor-container' + (style ? ' apply-style-rule' : '')}
    style="--local-font-size-offset: {fontSizeOffset}px"
    use:expandableTextareaAction
    use:loadInlineEditor={nodeId}
></div>

<style>
    .editor-container {
        width: 100%;
        min-height: var(--min-node-height);
        height: fit-content;
        overflow: hidden;
        display: flex;
    }

    .apply-style-rule {
        & .view-content {
            background-color: transparent !important;
        }
    }
</style>
