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
    export let density: 'normal' | 'compact' = 'normal';

    const cellRuntime = getCellRuntime();
    const loadInlineEditorAction = cellRuntime.loadInlineEditorAction;
    const expandableTextarea = cellRuntime.expandableTextareaAction;
    const isMobilePlatform = cellRuntime.isMobilePlatform;
    const getInlineEditorScrollHost = cellRuntime.getInlineEditorScrollHost;

    const attachInlineEditorScrollbar = (element: HTMLElement) => {
        let destroyScrollbar: (() => void) | null = null;
        let attachedHost: HTMLElement | null = null;
        let rafHandle: number | null = null;

        const detachScrollable = () => {
            destroyScrollbar?.();
            destroyScrollbar = null;
            attachedHost?.classList.remove('cell-scrollbar-mode--interaction');
            attachedHost = null;
        };

        const attachScrollable = () => {
            if (isMobilePlatform) return;
            const scrollHost = getInlineEditorScrollHost();
            if (!scrollHost || !element.contains(scrollHost)) {
                return;
            }
            if (attachedHost === scrollHost) {
                return;
            }

            detachScrollable();
            scrollHost.classList.add('cell-scrollbar-mode--interaction');
            destroyScrollbar =
                hideIdleScrollbar(scrollHost, {
                    mode: 'interaction',
                    enabled: true,
                }).destroy ?? null;
            attachedHost = scrollHost;
        };

        const scheduleAttach = (attemptsLeft = 10) => {
            if (rafHandle !== null) {
                cancelAnimationFrame(rafHandle);
            }
            rafHandle = requestAnimationFrame(() => {
                rafHandle = null;
                attachScrollable();
                if (!attachedHost && attemptsLeft > 1) {
                    scheduleAttach(attemptsLeft - 1);
                }
            });
        };

        scheduleAttach();

        return {
            destroy: () => {
                if (rafHandle !== null) {
                    cancelAnimationFrame(rafHandle);
                }
                detachScrollable();
            },
        };
    };
</script>

<CellScrollbar />

<div
    class={'editor-container' +
        (style ? ' apply-style-rule' : '') +
        (fillContent ? ' editor-container--fill' : '') +
        (density === 'compact' ? ' editor-container--compact' : '')}
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
        --mandala-editor-padding-y: 6px;
        --mandala-editor-padding-bottom: 20px;
        --mandala-editor-line-height: 1.4;
    }

    .editor-container--compact {
        --mandala-editor-padding-y: 2px;
        --mandala-editor-padding-bottom: 8px;
        --mandala-editor-line-height: 1.12;
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
