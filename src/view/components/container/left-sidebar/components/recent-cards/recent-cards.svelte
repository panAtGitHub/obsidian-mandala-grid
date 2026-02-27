<script lang="ts">
    import { getView } from '../../../context';
    import { ActiveStatus } from '../../../column/components/group/components/active-status.enum';
    import Node from '../../../column/components/group/components/card/card.svelte';
    import { documentStateStore } from '../../../../../../stores/view/derived/editing-store';
    import { IdSectionStore } from '../../../../../../stores/document/derived/id-section-store';
    import { onDestroy } from 'svelte';
    import { ActiveRecentNodeStore } from 'src/stores/view/derived/recent-nodes';
    import {
        scrollCardIntoView
    } from 'src/view/components/container/left-sidebar/components/recent-cards/helpers/scroll-card-into-view';
    import NoItems from '../no-items/no-items.svelte';
    import { removeDuplicatesFromArray } from 'src/helpers/array-helpers/remove-duplicates-from-array';
    import { navigationHistoryStore } from 'src/stores/view/derived/navigation-history-store';
    import { PendingConfirmationStore } from 'src/stores/view/derived/pending-confirmation';
    import { NodeStylesStore } from 'src/stores/view/derived/style-rules';

    const RECENT_NODES_LIMIT = 30;
    const view = getView();
    let recentNodes: string[] = [];

    let containerRef: HTMLElement | null = null;

    const idSection = IdSectionStore(view);
    const editingStateStore = documentStateStore(view);

    const activeRecentCard = ActiveRecentNodeStore(view);
    const pendingConfirmation = PendingConfirmationStore(view);
    const styleRules = NodeStylesStore(view);
    const subscriptions: (() => void)[] = [];
    subscriptions.push(
        ActiveRecentNodeStore(view).subscribe((activeNodeId) => {
            setTimeout(() => {
                if (!containerRef) return;
                if (!activeNodeId) return;
                scrollCardIntoView(containerRef, activeNodeId);
            }, 200);
        }),
    );

    subscriptions.push(
        navigationHistoryStore(view).subscribe((state) => {
            const items = state.items;
            if (items.length > RECENT_NODES_LIMIT) {
                const itemsToRemove = items.length - RECENT_NODES_LIMIT + 1;
                items.splice(0, itemsToRemove);
            }
            recentNodes = removeDuplicatesFromArray(items, true);
        }),
    );


    onDestroy(() => {
        for (const unsub of subscriptions) {
            unsub();
        }
    });
</script>

<div class="recent-cards-container" bind:this={containerRef}>
    {#if recentNodes.length > 0}
        {#each recentNodes as node (node)}
            <Node
                {node}
                active={$activeRecentCard === node
                    ? ActiveStatus.node
                    : ActiveStatus.sibling}
                editing={$editingStateStore.activeNodeId === node &&
                    $editingStateStore.isInSidebar === true}
                confirmDisableEdit={$editingStateStore.activeNodeId === node &&
                    $pendingConfirmation.disableEdit === node &&
                    $editingStateStore.isInSidebar === true}
                confirmDelete={$pendingConfirmation.deleteNode.has(node)}
                isInSidebar={true}
                section={$idSection[node]}
                selected={false}
                pinned={false}
                style={$styleRules.get(node)}
                alwaysShowCardButtons={true}
            />
        {/each}
    {:else}
        <NoItems variant="recent" />
    {/if}
</div>

<style>
    .recent-cards-container {
        height: 100%;
        width: 100%;

        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        flex: 1 1 auto;
        padding-bottom: 10px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }

    :global(.is-mobile) .recent-cards-container {
        padding-bottom: 24px;
    }

</style>
