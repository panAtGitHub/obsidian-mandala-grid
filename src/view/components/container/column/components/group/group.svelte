<script lang="ts">
    import Node from './components/card/card.svelte';
    import { ActiveStatus } from 'src/view/components/container/column/components/group/components/active-status.enum';
    import { getView } from 'src/view/components/container/context';
    import clx from 'classnames';
    import { EditingState } from 'src/stores/view/default-view-state';
    import { PendingDocumentConfirmation } from 'src/stores/view/view-state-type';
    import { nodesStore, singleColumnNodesStore } from 'src/stores/document/derived/nodes-store';
    import { NodeStyle } from 'src/stores/settings/types/style-rules-types';
    import { NodeSearchResult } from 'src/stores/view/subscriptions/effects/document-search/document-search';

    export let groupId: string;
    export let columnId: string;
    export let activeChildGroups: Set<string>;
    export let selectedNodes: Set<string>;
    export let parentNodes: Set<string>;
    export let activeGroup: string;
    export let activeNode: string;
    export let editedNodeState: EditingState;
    export let pendingConfirmation: PendingDocumentConfirmation;
    export let searchQuery: string;
    export let searchResults: Map<string,NodeSearchResult>;
    export let showAllNodes: boolean;
    export let pinnedNodes: Set<string>;
    export let searching: boolean;
    export let idSection: Record<string, string>;
    export let groupParentIds: Set<string>;
    export let firstColumn: boolean;
    export let styleRules: Map<string, NodeStyle>;
    export let outlineMode: boolean;
    export let allDndNodes: Set<string>;
    export let collapsedParents: Set<string>;
    export let hiddenNodes: Set<string>;
    export let alwaysShowCardButtons: boolean;
    const view = getView();
    const nodes = outlineMode
        ? singleColumnNodesStore(view)
        : nodesStore(view, columnId, groupId);
</script>

{#if $nodes.length > 0 && (searchQuery.length === 0 || showAllNodes || (searchResults.size > 0 && $nodes.some( (n) => searchResults.has(n) )))}
    <div
        class={clx(
            'group',
            /*(parentNodes.has(groupId) ||
                outlineMode ||
                (firstColumn && parentNodes.size > 0)) &&
                'group-has-active-parent',*/
            (activeChildGroups.has(groupId) || outlineMode) &&
                'group-has-active-child',
            (activeGroup === groupId || outlineMode) &&
                'group-has-active-node',
        )}
        id={'group-' + groupId}
    >
        {#each $nodes as node (node)}
            {#if (searchQuery.length === 0 || showAllNodes || (!searching && searchResults.has(node))) && !(allDndNodes.has(node) )}
                <Node
                    {node}
                    active={node === activeNode
                        ? ActiveStatus.node
                        : parentNodes.has(node)
                          ? ActiveStatus.parent
                          : activeChildGroups.has(groupId)
                            ? ActiveStatus.child
                            : activeGroup === groupId
                              ? ActiveStatus.sibling
                              : null}
                    editing={editedNodeState.activeNodeId === node &&
                        !editedNodeState.isInSidebar}
                    confirmDisableEdit={editedNodeState.activeNodeId === node &&
                        pendingConfirmation.disableEdit === node &&
                        !editedNodeState.isInSidebar}
                    confirmDelete={pendingConfirmation.deleteNode.has(node)}
                    hasActiveChildren={activeChildGroups.size > 0}
                    hasChildren={groupParentIds.has(node)}
                    section={idSection[node]}
                    selected={selectedNodes.has(node)}
                    pinned={pinnedNodes.has(node)}
                    isSearchMatch={searchResults.has(node)}
                    {firstColumn}
                    style={styleRules.get(node)}
                    {outlineMode}
                    collapsed={collapsedParents.has(node)}
                    hidden={hiddenNodes.has(node)}
                    {alwaysShowCardButtons}
                />
            {/if}
        {/each}
    </div>
{/if}

<style>

</style>
