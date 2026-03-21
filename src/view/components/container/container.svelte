<script lang="ts">
    import Column from './column/column.svelte';
    import { getView } from 'src/view/components/container/context';
    import {
        columnsStore,
        GroupParentIdsStore,
        IdSectionStore,
        PinnedNodesStore,
    } from 'src/stores/cell/document-derived-stores';
    import ColumnsBuffer from './buffers/columns-buffer.svelte';
    import { activeBranchStore } from 'src/stores/view/derived/active-branch-store';
    import { activeNodeStore } from 'src/stores/view/derived/active-node-store';
    import { documentStateStore } from 'src/stores/view/derived/editing-store';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import { NodeId } from 'src/stores/document/document-state-type';
    import { limitPreviewHeightStore } from 'src/stores/settings/derived/limit-preview-height-store';
    import { selectedNodesStore } from 'src/stores/view/derived/selected-nodes-store';
    import {
        AlwaysShowCardButtons,
        ApplyGapBetweenCardsStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
    import { PendingConfirmationStore } from 'src/stores/view/derived/pending-confirmation';
    import { onMount } from 'svelte';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
    import { zoomLevelStore } from 'src/stores/view/derived/zoom-level-store';
    import { textIsSelected } from 'src/view/actions/context-menu/card-context-menu/helpers/text-is-selected';
    import { hideFloatingButtons } from 'src/view/actions/hide-floating-buttons';

    const view = getView();

    const columns = columnsStore(view);
    const activeBranch = activeBranchStore(view);
    const activeNode = activeNodeStore(view);
    const selectedNodes = selectedNodesStore(view);
    const editing = documentStateStore(view);
    const search = searchStore(view);
    const limitPreviewHeight = limitPreviewHeightStore(view);
    const idSection = IdSectionStore(view);
    let parentNodes: Set<NodeId> = new Set<NodeId>();
    $: parentNodes = new Set($activeBranch.sortedParentNodes);
    const groupParentIds = GroupParentIdsStore(view);
    const pinnedNodesArray = PinnedNodesStore(view);
    const alwaysShowCardButtons = AlwaysShowCardButtons(view);
    $: pinnedNodes = new Set<string>($pinnedNodesArray);
    const zoom = zoomLevelStore(view);

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
            saveNodeContent(view, true);
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
        ($zoom !== 1 ? ' zoom-enabled' : '')}
    id="columns-container"
    tabindex="0"
    on:click={saveNode}
    on:dblclick={centerActiveNode}
    use:hideFloatingButtons
>
    <div class="columns">
        <ColumnsBuffer />

        {#each $columns as column (column.id)}
            <Column
                columnId={column.id}
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
