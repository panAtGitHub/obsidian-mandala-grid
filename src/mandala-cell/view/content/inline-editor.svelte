<script lang="ts">
    import { NodeId } from 'src/mandala-document/state/document-state-type';
    import { NodeStyle } from 'src/mandala-settings/state/types/style-rules-types';
    import { hideIdleScrollbar } from 'src/mandala-cell/view/actions/cell-scrollbar';
    import CellScrollbar from 'src/mandala-cell/view/style/cell-scrollbar.svelte';
    import { getCellRuntime } from 'src/view/context';

    export let nodeId: NodeId;
    export let style: NodeStyle | undefined;
    export let fontSizeOffset: number = 0;
    export let absoluteFontSize: number | undefined = undefined;
    export let disableAutoResize: boolean = false;
    export let fillContent = false;

    const cellRuntime = getCellRuntime();
    const loadInlineEditorAction = cellRuntime.loadInlineEditorAction;
    const expandableTextarea = cellRuntime.expandableTextareaAction;
    const isMobilePlatform = cellRuntime.isMobilePlatform;

    const attachInlineEditorScrollbar = (element: HTMLElement) => {
        let scroller: HTMLElement | null = null;
        let scrollerCleanup: { destroy?: () => void } | null = null;

        const detachScroller = () => {
            scrollerCleanup?.destroy?.();
            scrollerCleanup = null;
            scroller?.classList.remove('cell-scrollbar-mode--interaction');
            scroller = null;
        };

        const attachScroller = (nextScroller: HTMLElement | null) => {
            if (nextScroller === scroller) return;
            detachScroller();
            if (!nextScroller || isMobilePlatform) return;
            scroller = nextScroller;
            scroller.classList.add('cell-scrollbar-mode--interaction');
            scrollerCleanup = hideIdleScrollbar(scroller, {
                mode: 'interaction',
                enabled: true,
            });
        };

        const syncScroller = () => {
            attachScroller(element.querySelector('.cm-editor .cm-scroller'));
        };

        const observer = new MutationObserver(() => {
            syncScroller();
        });

        observer.observe(element, {
            childList: true,
            subtree: true,
        });
        syncScroller();

        return {
            destroy: () => {
                observer.disconnect();
                detachScroller();
            },
        };
    };
</script>

<CellScrollbar />

<div
    class={'editor-container' +
        (style ? ' apply-style-rule' : '') +
        (fillContent ? ' editor-container--fill' : '')}
    style="--local-font-size-offset: {absoluteFontSize ? 0 : fontSizeOffset}px; {absoluteFontSize ? `--font-text-size: ${absoluteFontSize}px; font-size: ${absoluteFontSize}px;` : ''}"
    use:loadInlineEditorAction={nodeId}
    use:expandableTextarea={!disableAutoResize}
    use:attachInlineEditorScrollbar
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
        box-sizing: border-box;
    }

    .editor-container--fill :global(.cm-editor .cm-scroller) {
        overflow-y: auto !important;
        overflow-x: hidden !important;
    }

    .apply-style-rule {
        & .view-content {
            background-color: transparent !important;
        }
    }
</style>
