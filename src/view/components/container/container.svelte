<script lang="ts">
    import Column from './column/column.svelte';
    import { getView } from 'src/view/components/container/context';
    import { scrollOnDndX } from 'src/view/actions/dnd/scroll-on-dnd-x/scroll-on-dnd-x';
    import { columnsStore, singleColumnStore } from 'src/stores/document/derived/columns-store';
    import ColumnsBuffer from './buffers/columns-buffer.svelte';
    import { dndStore } from 'src/stores/view/derived/dnd-store';
    import { activeBranchStore } from 'src/stores/view/derived/active-branch-store';
    import { activeNodeStore } from 'src/stores/view/derived/active-node-store';
    import { documentStateStore } from 'src/stores/view/derived/editing-store';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import { NodeId } from 'src/stores/document/document-state-type';
    import { limitPreviewHeightStore } from 'src/stores/settings/derived/limit-preview-height-store';
    import { IdSectionStore } from 'src/stores/document/derived/id-section-store';
    import { selectedNodesStore } from 'src/stores/view/derived/selected-nodes-store';
    import { PinnedNodesStore } from 'src/stores/document/derived/pinned-nodes-store';
    import { GroupParentIdsStore } from 'src/stores/document/derived/meta';
    import { AlwaysShowCardButtons, ApplyGapBetweenCardsStore } from 'src/stores/settings/derived/view-settings-store';
    import {
        saveNodeContent
    } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
    import { PendingConfirmationStore } from 'src/stores/view/derived/pending-confirmation';
    import { NodeStylesStore } from 'src/stores/view/derived/style-rules';
    import { onMount } from 'svelte';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
    import { zoomLevelStore } from 'src/stores/view/derived/zoom-level-store';
    import { getAllChildren } from 'src/lib/tree-utils/get/get-all-children';
    import { textIsSelected } from 'src/view/actions/context-menu/card-context-menu/helpers/text-is-selected';
    import { OutlineStore } from 'src/stores/view/derived/outline-store';
    import { hideFloatingButtons } from 'src/view/actions/hide-floating-buttons';
    import { scrollOnDndY } from 'src/view/actions/dnd/scroll-on-dnd-y/scroll-on-dnd-y';

    export let outlineMode: boolean;

    const view = getView();

    const columns = outlineMode
        ? singleColumnStore(view)
        : columnsStore(view);
    const dnd = dndStore(view);
    const activeBranch = activeBranchStore(view);
    const activeNode = activeNodeStore(view);
    const selectedNodes = selectedNodesStore(view);
    const editing = documentStateStore(view);
    const search = searchStore(view);
    const limitPreviewHeight = limitPreviewHeightStore(view);
    const idSection = IdSectionStore(view);
    const styleRules = NodeStylesStore(view);
    let parentNodes: Set<NodeId> = new Set<NodeId>();
    $: parentNodes = new Set($activeBranch.sortedParentNodes);
    const groupParentIds = GroupParentIdsStore(view);
    const pinnedNodesArray = PinnedNodesStore(view);
    const outline = OutlineStore(view);
    const alwaysShowCardButtons = AlwaysShowCardButtons(view);
    $: pinnedNodes = new Set<string>($pinnedNodesArray);
    const zoom = zoomLevelStore(view);
    let allDndNodes: Set<string> = new Set();

    $: {
        if (outlineMode && $dnd.node) {
            allDndNodes = new Set(
                getAllChildren(
                    view.documentStore.getValue().document.columns,
                    $dnd.node,
                ),
            );
        } else {
            allDndNodes = new Set();
        }
    }

    const applyGap = ApplyGapBetweenCardsStore(view);
    const pendingConfirmation = PendingConfirmationStore(view);
    const saveNode = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.closest('.lng-prev') || target.closest('.active-node')) {
            return;
        }
        if (textIsSelected()) return;
        const editingState = view.viewStore.getValue().document.editing;
        if (editingState.activeNodeId) {
            saveNodeContent(view,true);
        }
    };

    const centerActiveNode = (event: MouseEvent) => {
        if (!event.shiftKey) return;
        const target = event.target as HTMLElement;
        if (target.closest('.lng-prev') || target.closest('.active-node')) {
            return;
        }
        view.alignBranch.align({
            type: 'view/align-branch/center-node',
        });
    };

    let containerRef: HTMLElement | null = null;
    onMount(() => {
        view.container = containerRef;
        view.alignBranch.align({ type: 'view/life-cycle/mount' });
        focusContainer(view);
    });
</script>

<div
    bind:this={containerRef}
    class={'columns-container ' +
        ($limitPreviewHeight ? ' limit-card-height' : '') +
        ($applyGap ? ' gap-between-cards' : '') +
        (outlineMode ? ' outline-mode' : '') +
        ($zoom !== 1 ? ' zoom-enabled' : '')}
    id="columns-container"
    tabindex="0"
    on:click={saveNode}
    on:dblclick={centerActiveNode}
    use:scrollOnDndX
    use:scrollOnDndY
    use:hideFloatingButtons
>
    <div class="columns">
        <ColumnsBuffer />

        {#each $columns as column, i (column.id)}
            <Column
                columnId={column.id}
                dndChildGroups={$dnd.childGroups}
                {parentNodes}
                activeGroup={$activeBranch.group}
                activeChildGroups={$activeBranch.childGroups}
                activeNode={$activeNode}
                editedNodeState={$editing}
                searchQuery={$search.query}
                searchResults={$search.results}
                showAllNodes={$search.showAllNodes}
                searching={$search.searching}
                idSection={$idSection}
                selectedNodes={$selectedNodes}
                {pinnedNodes}
                pendingConfirmation={$pendingConfirmation}
                groupParentIds={$groupParentIds}
                firstColumn={i === 0}
                styleRules={$styleRules}
                {outlineMode}
                {allDndNodes}
                collapsedParents={$outline.collapsedParents}
                hiddenNodes={$outline.hiddenNodes}
                alwaysShowCardButtons={$alwaysShowCardButtons}
            />
        {/each}
        <ColumnsBuffer />
    </div>
</div>

<style>
    .columns-container {
        --scrollbar-thumb-bg: transparent;
        --scrollbar-active-thumb-bg: transparent;
        --scrollbar-bg: transparent;
    }


    .columns-container::-webkit-scrollbar {
        display: none;
    }

</style>
