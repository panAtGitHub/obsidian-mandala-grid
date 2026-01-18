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
        navigateToSearchResult
    } from 'src/view/helpers/mandala/search-utils';
    import {
        setActiveSidebarNode
    } from 'src/stores/view/subscriptions/actions/set-active-sidebar-node';
    import { SectionColorBySectionStore } from 'src/stores/document/derived/section-colors-store';

    const view = getView();
    const pinnedNodesArray = PinnedNodesStore(view);
    const sectionColors = SectionColorBySectionStore(view);

    const activePinnedCard = ActivePinnedCardStore(view);

    type PinnedItem = {
        nodeId: string;
        section: string;
        title: string;
        body: string;
    };

    const parsePinnedContent = (content: string) => {
        const lines = content.split('\n');
        const titleLine = lines.find((line) => line.trim().length > 0) || '';
        const title = titleLine.replace(/^#+\s*/, '').trim();
        const titleIndex = lines.indexOf(titleLine);
        const bodyLine =
            lines.slice(titleIndex + 1).find((line) => line.trim().length > 0) ||
            '';
        return { title, body: bodyLine.trimEnd() };
    };

    const pinnedItems = derived(
        [pinnedNodesArray, view.documentStore],
        ([$pinnedNodesArray, $doc]): PinnedItem[] => {
            return $pinnedNodesArray
                .map((nodeId) => {
                    const section = $doc.sections.id_section[nodeId];
                    if (!section) return null;
                    const content = $doc.document.content[nodeId]?.content || '';
                    const preview = parsePinnedContent(content);
                    return {
                        nodeId,
                        section,
                        title: preview.title,
                        body: preview.body,
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
                    class:has-color={Boolean($sectionColors[item.section])}
                    style={item.section && $sectionColors[item.section]
                        ? `--pinned-item-bg: ${$sectionColors[item.section]};`
                        : undefined}
                    id={item.nodeId}
                    on:click={() => handleClick(item)}
                    on:keydown={(event) => handleKeydown(event, item)}
                    role="button"
                    tabindex="0"
                >
                    <div class="pinned-header">
                        <div class="section-path">{item.section}</div>
                        <div class="pinned-title">{item.title}</div>
                    </div>
                    {#if item.body}
                        <div class="content-preview">{item.body}</div>
                    {/if}
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
        -webkit-overflow-scrolling: touch;
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
        background: var(--pinned-item-bg, #fff);
        transition: background-color 0.1s ease, border-color 0.1s ease;
    }

    .pinned-list-item:hover {
        background: var(--pinned-item-bg, #f5f5f5);
    }

    .pinned-list-item:active {
        background: var(--pinned-item-bg, var(--background-modifier-active-hover));
    }

    .pinned-list-item.selected {
        background: var(--pinned-item-bg, #fff);
        outline: 2px solid var(--interactive-accent);
        outline-offset: -2px;
    }

    .pinned-header {
        display: flex;
        align-items: baseline;
        gap: 8px;
        justify-content: space-between;
        margin-bottom: 4px;
    }

    .section-path {
        font-size: 12px;
        font-weight: 600;
        color: inherit;
        font-family: var(--font-monospace);
    }

    .pinned-title {
        font-size: 13px;
        font-weight: 600;
        color: inherit;
        text-align: right;
        margin-left: auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 70%;
    }

    .content-preview {
        font-size: 12px;
        color: inherit;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.4;
    }

    :global(.theme-light) .pinned-list-item.has-color {
        color: var(--text-normal);
    }

    :global(.is-mobile) .pinned-cards-container {
        padding-bottom: 24px;
    }
</style>
