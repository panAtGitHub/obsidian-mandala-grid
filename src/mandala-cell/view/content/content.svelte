<script lang="ts">
    import { get } from 'svelte/store';
    import { createMobileDoubleTapDetector } from 'src/mandala-interaction/helpers/mobile-double-tap';
    import { getCellRuntime } from 'src/view/context';
    import { getCursorPosition } from 'src/mandala-cell/viewmodel/content-event-handlers/get-cursor-position';

    export let nodeId: string;
    export let hideBuiltInHiddenInfo = false;
    export let fillContent = false;
    export let density: 'normal' | 'compact' = 'normal';
    export let isMobilePlatform = false;
    export let activateNode: (event: MouseEvent) => void = () => {};
    export let enableEditMode: () => void = () => {};
    export let onMobilePreviewDoubleTapEdit:
        | ((nodeId: string) => void)
        | null = null;

    const cellRuntime = getCellRuntime();
    const showHiddenCardInfo = cellRuntime.showHiddenCardInfo;
    const markdownPreview = cellRuntime.markdownPreviewAction;
    const doubleTapDetector = createMobileDoubleTapDetector();

    const enableEditModeAtCursor = (e: MouseEvent) => {
        const content = get(cellRuntime.contentForNode(nodeId));
        const cursor = getCursorPosition(content, e);
        activateNode(e);
        if (cursor) {
            cellRuntime.setInlineCursor(nodeId, cursor);
        }
        enableEditMode();
    };

    const isInteractiveTarget = (target: HTMLElement | null) =>
        Boolean(
            target?.closest('a, button, input, textarea, select, [role="button"]'),
        );

    const handleMobileTouchEnd = (e: TouchEvent) => {
        if (!isMobilePlatform) return;
        if (!onMobilePreviewDoubleTapEdit) {
            doubleTapDetector.reset();
            return;
        }

        const target = e.target as HTMLElement | null;
        if (isInteractiveTarget(target)) {
            doubleTapDetector.reset();
            return;
        }

        const touch = e.changedTouches.item(0);
        if (!touch) {
            doubleTapDetector.reset();
            return;
        }

        const isDoubleTap = doubleTapDetector.registerTap({
            key: nodeId,
            x: touch.clientX,
            y: touch.clientY,
        });
        if (!isDoubleTap) return;

        e.preventDefault();
        e.stopPropagation();
        onMobilePreviewDoubleTapEdit(nodeId);
    };

    const handleClick = (e: MouseEvent) => {
        if (cellRuntime.isGrabbing()) return;

        // 移动端：仅激活节点，禁止任何编辑相关的副作用
        if (isMobilePlatform) {
            const target = e.target as HTMLElement | null;
            const anchor = target?.closest('a');
            if (anchor) {
                cellRuntime.handleLinks(e);
                return;
            }

            if (onMobilePreviewDoubleTapEdit) {
                e.stopPropagation(); // 防止冒泡到 MandalaCard 再次触发选择逻辑
                return;
            }

            activateNode(e);
            e.stopPropagation(); // 防止冒泡到 MandalaCard 再次触发选择逻辑
            return;
        }

        cellRuntime.handleLinks(e);
        activateNode(e);

        // 内容层已完成点击处理，避免继续冒泡到外层卡片重复触发选择逻辑
        e.stopPropagation();
    };

    const handleDoubleClick = (e: MouseEvent) => {
        if (cellRuntime.isGrabbing()) return;

        // 移动端：双击不进入编辑，由父组件 MandalaCard 处理导航（3x3）/无动作（9x9）
        if (isMobilePlatform) {
            return;
        }

        enableEditModeAtCursor(e);

        // 避免双击同时触发外层卡片的双击处理，造成重复进入编辑与卡顿
        e.stopPropagation();
    };

</script>
<div
    class="lng-prev markdown-preview-section markdown-rendered"
    class:lng-prev--fill={fillContent}
    class:lng-prev--compact={density === 'compact'}
    on:click={handleClick}
    on:touchend|capture={handleMobileTouchEnd}
    on:dblclick={handleDoubleClick}
    class:hide-hidden-info={hideBuiltInHiddenInfo || !$showHiddenCardInfo}
    use:markdownPreview={nodeId}
></div>

<style>
    .lng-prev {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        min-height: var(--min-node-height);
        box-sizing: border-box;
        position: relative;

        font-size: var(--font-text-size);
        --mandala-content-left-inset: 6px;
        --mandala-content-right-inset: 6px;
        padding: 6px var(--mandala-content-right-inset) 10px
            var(--mandala-content-left-inset);
        color-scheme: light;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .lng-prev::-webkit-scrollbar {
        width: 0;
        height: 0;
    }

    .lng-prev--fill {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
    }

    .lng-prev--compact {
        padding: 2px var(--mandala-content-right-inset) 3px
            var(--mandala-content-left-inset);
        line-height: 1.12;
        --p-spacing: 0px;
    }

    .lng-prev--compact > :global(*) {
        max-height: none !important;
        overflow: visible !important;
    }

    .lng-prev--compact :global(p) {
        margin-block-start: 0 !important;
        margin-block-end: 0 !important;
        line-height: 1.12;
    }

    .lng-prev--compact :global(h1),
    .lng-prev--compact :global(h2),
    .lng-prev--compact :global(h3),
    .lng-prev--compact :global(h4),
    .lng-prev--compact :global(h5),
    .lng-prev--compact :global(h6) {
        margin-top: 0 !important;
        margin-bottom: 1px !important;
        line-height: 1.08;
    }
</style>
