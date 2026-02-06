<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import { markdownPreviewAction } from 'src/view/actions/markdown-preview/markdown-preview-action';
    import {
        handleLinks
    } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/handle-links';
    import { ActiveStatus } from 'src/view/components/container/column/components/group/components/active-status.enum';
    import {
        getCursorPosition
    } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/get-cursor-position';
    import { get } from 'svelte/store';
    import { contentStore } from 'src/stores/document/derived/content-store';
    import { isGrabbing } from './event-handlers/helpers/is-grabbing';
    import {
        MaintainEditMode,
        ShowHiddenCardInfoStore,
    } from '../../../../../../../../../../stores/settings/derived/view-settings-store';
    import {
        setActiveSidebarNode
    } from '../../../../../../../../../../stores/view/subscriptions/actions/set-active-sidebar-node';
    import { setActiveMainSplitNode } from './store-actions/set-active-main-split-node';
    import { enableEditModeInSidebar } from './store-actions/enable-edit-mode-in-sidebar';
    import { enableEditModeInMainSplit } from './store-actions/enable-edit-mode-in-main-split';

    export let nodeId: string;
    export let isInSidebar: boolean;
    export let active: ActiveStatus | null;

    const view = getView();
    const showHiddenCardInfo = ShowHiddenCardInfoStore(view);

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

    const anotherNodeIsBeingEdited = () => {
        const isNotActiveNode = active !== ActiveStatus.node;
        const editingState = view.viewStore.getValue().document.editing;
        return (
            isNotActiveNode &&
            editingState.activeNodeId &&
            !editingState.isInSidebar
        );
    };

    import { Platform } from 'obsidian';

    const DOUBLE_CLICK_THRESHOLD_MS = 250;
    let lastClickAt = 0;
    let prevClickAt = 0;

    const recordClick = () => {
        prevClickAt = lastClickAt;
        lastClickAt = Date.now();
    };

    const isFastDoubleClick = () =>
        lastClickAt - prevClickAt <= DOUBLE_CLICK_THRESHOLD_MS;

    const handleClick = (e: MouseEvent) => {
        if (isGrabbing(view)) return;
        recordClick();
        
        // 移动端：仅激活节点，禁止任何编辑相关的副作用
        if (Platform.isMobile) {
            const target = e.target as HTMLElement | null;
            const anchor = target?.closest('a.internal-link');
            if (anchor) {
                handleLinks(view, e);
                return;
            }
            setActiveNode(e);
            e.stopPropagation(); // 防止冒泡到 MandalaCard 再次触发选择逻辑
            return;
        }

        const maintainEditMode = get(MaintainEditMode(view));
        const enableEditOnSingleClick =
            maintainEditMode && !isInSidebar && anotherNodeIsBeingEdited();

        if (enableEditOnSingleClick) {
            enableEditModeAtCursor(e);
        } else {
            handleLinks(view, e);
            setActiveNode(e);
        }
    };

    const handleDoubleClick = (e: MouseEvent) => {
        if (isGrabbing(view)) return;
        if (!isFastDoubleClick()) return;

        // 移动端：双击不进入编辑，由父组件 MandalaCard 处理导航（3x3）/无动作（9x9）
        if (Platform.isMobile) {
            return;
        }

        enableEditModeAtCursor(e);
    };
</script>

<div
    class={'lng-prev markdown-preview-view markdown-preview-section markdown-rendered'}
    on:click={handleClick}
    on:dblclick={handleDoubleClick}
    class:hide-hidden-info={!$showHiddenCardInfo}
    use:markdownPreviewAction={nodeId}
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
