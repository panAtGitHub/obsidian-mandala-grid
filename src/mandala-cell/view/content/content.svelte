<script lang="ts">
    import { Platform } from 'obsidian';
    import { createEventDispatcher } from 'svelte';
    import { get } from 'svelte/store';
    import { contentStore } from 'src/stores/cell/document-derived-stores';
    import { ShowHiddenCardInfoStore } from 'src/mandala-settings/state/derived/view-settings-store';
    import { setActiveSidebarNode } from 'src/stores/view/subscriptions/actions/set-active-sidebar-node';
    import { hideIdleScrollbar } from 'src/view/actions/hide-idle-scrollbar';
    import { markdownPreviewAction } from 'src/view/actions/markdown-preview/markdown-preview-action';
    import { createMobileDoubleTapDetector } from 'src/helpers/views/mandala/mobile-double-tap';
    import { enableEditModeInMainSplit } from 'src/mandala-cell/viewmodel/actions/enable-edit-mode-in-main-split';
    import { enableEditModeInSidebar } from 'src/mandala-cell/viewmodel/actions/enable-edit-mode-in-sidebar';
    import { setActiveMainSplitNode } from 'src/mandala-cell/viewmodel/actions/set-active-main-split-node';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { getCursorPosition } from 'src/mandala-cell/viewmodel/content-event-handlers/get-cursor-position';
    import { handleLinks } from 'src/mandala-cell/viewmodel/content-event-handlers/handle-links/handle-links';
    import { isGrabbing } from 'src/mandala-cell/viewmodel/content-event-handlers/helpers/is-grabbing';

    export let nodeId: string;
    export let isInSidebar: boolean;
    export let mobileSidebarRenderedEditEnabled = false;
    export let hideBuiltInHiddenInfo = false;

    const view = getView();
    const showHiddenCardInfo = ShowHiddenCardInfoStore(view);
    const dispatch = createEventDispatcher<{
        mobilePreviewDoubleTapEdit: { nodeId: string };
    }>();
    const doubleTapDetector = createMobileDoubleTapDetector();

    const setActiveNode = (e: MouseEvent) => {
        if (isInSidebar) {
            setActiveSidebarNode(view, nodeId);
        } else {
            setActiveMainSplitNode(view, nodeId, e);
        }
    };

    const enableEditMode = () => {
        if (isInSidebar) {
            enableEditModeInSidebar(view, nodeId);
        } else {
            enableEditModeInMainSplit(view, nodeId);
        }
    };

    const enableEditModeAtCursor = (e: MouseEvent) => {
        const content = get(contentStore(view, nodeId));
        const cursor = getCursorPosition(content, e);
        setActiveNode(e);
        if (cursor) {
            view.inlineEditor.setNodeCursor(nodeId, cursor);
        }
        enableEditMode();
    };

    const isInteractiveTarget = (target: HTMLElement | null) =>
        Boolean(
            target?.closest('a, button, input, textarea, select, [role="button"]'),
        );

    const handleMobileTouchEnd = (e: TouchEvent) => {
        if (!Platform.isMobile) return;
        if (!mobileSidebarRenderedEditEnabled) {
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
        dispatch('mobilePreviewDoubleTapEdit', { nodeId });
    };

    const handleClick = (e: MouseEvent) => {
        if (isGrabbing(view)) return;

        // 移动端：仅激活节点，禁止任何编辑相关的副作用
        if (Platform.isMobile) {
            const target = e.target as HTMLElement | null;
            const anchor = target?.closest('a');
            if (anchor) {
                handleLinks(view, e);
                return;
            }

            if (mobileSidebarRenderedEditEnabled) {
                e.stopPropagation(); // 防止冒泡到 MandalaCard 再次触发选择逻辑
                return;
            }

            setActiveNode(e);
            e.stopPropagation(); // 防止冒泡到 MandalaCard 再次触发选择逻辑
            return;
        }

        handleLinks(view, e);
        setActiveNode(e);

        // 内容层已完成点击处理，避免继续冒泡到外层卡片重复触发选择逻辑
        e.stopPropagation();
    };

    const handleDoubleClick = (e: MouseEvent) => {
        if (isGrabbing(view)) return;

        // 移动端：双击不进入编辑，由父组件 MandalaCard 处理导航（3x3）/无动作（9x9）
        if (Platform.isMobile) {
            return;
        }

        enableEditModeAtCursor(e);

        // 避免双击同时触发外层卡片的双击处理，造成重复进入编辑与卡顿
        e.stopPropagation();
    };
</script>

<div
    class="lng-prev markdown-preview-view markdown-preview-section markdown-rendered"
    on:click={handleClick}
    on:touchend|capture={handleMobileTouchEnd}
    on:dblclick={handleDoubleClick}
    class:hide-hidden-info={hideBuiltInHiddenInfo || !$showHiddenCardInfo}
    use:markdownPreviewAction={nodeId}
    use:hideIdleScrollbar
></div>

<style>
    .lng-prev {
        width: 100%;
        min-height: var(--min-node-height);

        font-size: var(--font-text-size);
        padding: 6px 6px 10px 12px;
        color-scheme: light;
    }
</style>
