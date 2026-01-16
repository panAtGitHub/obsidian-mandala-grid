<script lang="ts">
    import { derived } from 'svelte/store';
    import { PinnedNodesStore } from '../../../../../../stores/document/derived/pinned-nodes-store';
    import { getView } from '../../../context';
    import { ActivePinnedCardStore } from '../../../../../../stores/view/derived/pinned-cards-sidebar';
    import NoItems from '../no-items/no-items.svelte';
    import {
        scrollActivePinnedNode
    } from 'src/view/components/container/left-sidebar/components/pinned-cards/actions/scroll-active-pinned-node';
    import {
        extractPreview,
        navigateToSearchResult
    } from 'src/view/helpers/mandala/search-utils';
    import {
        setActiveSidebarNode
    } from 'src/stores/view/subscriptions/actions/set-active-sidebar-node';

    const view = getView();
    const pinnedNodesArray = PinnedNodesStore(view);

    const activePinnedCard = ActivePinnedCardStore(view);

    type PinnedItem = {
        nodeId: string;
        section: string;
        contentPreview: string;
    };

    const pinnedItems = derived(
        [pinnedNodesArray, view.documentStore],
        ([$pinnedNodesArray, $doc]): PinnedItem[] => {
            return $pinnedNodesArray
                .map((nodeId) => {
                    const section = $doc.sections.id_section[nodeId];
                    if (!section) return null;
                    const content = $doc.document.content[nodeId]?.content || '';
                    return {
                        nodeId,
                        section,
                        contentPreview: extractPreview(content),
                    };
                })
                .filter((item): item is PinnedItem => Boolean(item));
        },
    );

    const handleClick = (item: PinnedItem) => {
        setActiveSidebarNode(view, item.nodeId);
        navigateToSearchResult(item.section, view);
    };

    const handleKeydown = (event: KeyboardEvent, item: PinnedItem) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        handleClick(item);
    };
</script>

<div class="pinned-cards-container" use:scrollActivePinnedNode>
    {#if $pinnedItems.length > 0}
        <div class="pinned-list">
            {#each $pinnedItems as item (item.nodeId)}
                <div
                    class="pinned-list-item"
                    class:selected={$activePinnedCard === item.nodeId}
                    id={item.nodeId}
                    on:click={() => handleClick(item)}
                    on:keydown={(event) => handleKeydown(event, item)}
                    role="button"
                    tabindex="0"
                >
                    <div class="section-path">{item.section}</div>
                    <div class="content-preview">{item.contentPreview}</div>
                </div>
            {/each}
        </div>
    {:else}
        <NoItems variant="pinned" />
    {/if}
</div>

<style>
    .pinned-cards-container {
        height: 100%;
        width: 100%;

        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        flex: 1 1 auto;
        padding: 8px 8px 10px;
        overflow-y: auto;
    }

    .pinned-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
    }

    .pinned-list-item {
        padding: 8px 10px;
        cursor: pointer;
        border: 1px solid var(--background-modifier-border);
        border-radius: var(--radius-m);
        background: #fff;
        transition: background-color 0.1s ease, border-color 0.1s ease;
    }

    .pinned-list-item:hover {
        background: #f5f5f5;
    }

    .pinned-list-item:active {
        background: var(--background-modifier-active-hover);
    }

    .pinned-list-item.selected {
        background: #fff;
        outline: 2px solid var(--interactive-accent);
        outline-offset: -2px;
    }

    .section-path {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-accent);
        margin-bottom: 4px;
        font-family: var(--font-monospace);
    }

    .content-preview {
        font-size: 12px;
        color: var(--text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.4;
    }
</style>
