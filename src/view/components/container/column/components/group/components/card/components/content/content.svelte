<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import { markdownPreviewAction } from 'src/view/actions/markdown-preview/markdown-preview-action';
    import {
        handleLinks
    } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/handle-links';
    import {
        getCursorPosition
    } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/get-cursor-position';
    import { createEventDispatcher } from 'svelte';
    import { get } from 'svelte/store';
    import { contentStore } from 'src/stores/document/derived/content-store';
    import { isGrabbing } from './event-handlers/helpers/is-grabbing';
    import {
        ShowHiddenCardInfoStore,
    } from '../../../../../../../../../../stores/settings/derived/view-settings-store';
    import {
        setActiveSidebarNode
    } from '../../../../../../../../../../stores/view/subscriptions/actions/set-active-sidebar-node';
    import { setActiveMainSplitNode } from './store-actions/set-active-main-split-node';
    import { enableEditModeInSidebar } from './store-actions/enable-edit-mode-in-sidebar';
    import { enableEditModeInMainSplit } from './store-actions/enable-edit-mode-in-main-split';
    import { hideIdleScrollbar } from 'src/view/actions/hide-idle-scrollbar';

    export let nodeId: string;
    export let isInSidebar: boolean;
    export let mobileSidebarRenderedEditEnabled = false;

    const view = getView();
    const showHiddenCardInfo = ShowHiddenCardInfoStore(view);
    const dispatch = createEventDispatcher<{
        mobileRenderedDoubleTapEdit: { nodeId: string };
    }>();
    let lastMobileTapAt = 0;
    let lastMobileTapNodeId: string | null = null;
    let lastMobileTapX = 0;
    let lastMobileTapY = 0;
    const MOBILE_DOUBLE_TAP_WINDOW_MS = 360;
    const MOBILE_DOUBLE_TAP_MIN_INTERVAL_MS = 80;
    const MOBILE_DOUBLE_TAP_MAX_DISTANCE_PX = 32;

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

    import { Platform } from 'obsidian';
    const isInteractiveTarget = (target: HTMLElement | null) =>
        Boolean(
            target?.closest('button, input, textarea, select, [role="button"]'),
        );
    const resetMobileTapState = () => {
        lastMobileTapAt = 0;
        lastMobileTapNodeId = null;
        lastMobileTapX = 0;
        lastMobileTapY = 0;
    };

    const handleClick = (e: MouseEvent) => {
        if (isGrabbing(view)) return;

        // 移动端：仅激活节点，禁止任何编辑相关的副作用
        if (Platform.isMobile) {
            const target = e.target as HTMLElement | null;
            const anchor = target?.closest('a');
            if (anchor) {
                resetMobileTapState();
                handleLinks(view, e);
                return;
            }

            if (mobileSidebarRenderedEditEnabled) {
                if (isInteractiveTarget(target)) {
                    resetMobileTapState();
                }
                e.stopPropagation(); // 防止冒泡到 MandalaCard 再次触发选择逻辑
                if (isInteractiveTarget(target)) {
                    return;
                }
                const now = Date.now();
                const delta = now - lastMobileTapAt;
                const dx = e.clientX - lastMobileTapX;
                const dy = e.clientY - lastMobileTapY;
                const distance = Math.hypot(dx, dy);
                const isDoubleTap =
                    delta >= MOBILE_DOUBLE_TAP_MIN_INTERVAL_MS &&
                    delta <= MOBILE_DOUBLE_TAP_WINDOW_MS &&
                    lastMobileTapNodeId === nodeId &&
                    distance <= MOBILE_DOUBLE_TAP_MAX_DISTANCE_PX;
                lastMobileTapAt = now;
                lastMobileTapNodeId = nodeId;
                lastMobileTapX = e.clientX;
                lastMobileTapY = e.clientY;
                if (isDoubleTap) {
                    e.preventDefault();
                    e.stopPropagation();
                    resetMobileTapState();
                    dispatch('mobileRenderedDoubleTapEdit', { nodeId });
                }
                return;
            }

            setActiveNode(e);
            if (isInteractiveTarget(target)) {
                resetMobileTapState();
            }
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
    on:dblclick={handleDoubleClick}
    class:hide-hidden-info={!$showHiddenCardInfo}
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
