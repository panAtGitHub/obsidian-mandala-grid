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
    export let fillContent = false;
</script>

<div
    class={'editor-container' +
        (style ? ' apply-style-rule' : '') +
        (fillContent ? ' editor-container--fill' : '')}
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

    .editor-container--fill {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
        overflow: hidden;
    }

    .editor-container--fill :global(.mandala-inline-editor),
    .editor-container--fill :global(.markdown-source-view),
    .editor-container--fill :global(.view-content) {
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
        min-height: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .editor-container--fill :global(.cm-editor),
    .editor-container--fill :global(.cm-editor .cm-scroller) {
        width: 100%;
        min-width: 0;
        height: 100%;
    }

    .apply-style-rule {
        & .view-content {
            background-color: transparent !important;
        }
    }
</style>
