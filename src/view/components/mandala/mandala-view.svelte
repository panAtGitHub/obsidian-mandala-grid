<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { derived } from 'src/lib/store/derived';
    import { getView } from 'src/view/components/container/context';
    import MandalaCard from 'src/view/components/mandala/mandala-card.svelte';
    import Content from 'src/view/components/container/column/components/group/components/card/components/content/content.svelte';
    import { ActiveStatus } from 'src/view/components/container/column/components/group/components/active-status.enum';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';

    const view = getView();

    const mode = writable<'3x3' | '9x9'>('3x3');
    const toggleMode = () => {
        mode.update((m) => (m === '3x3' ? '9x9' : '3x3'));
    };

    $: view.mandalaMode = $mode;

    const sectionToNodeId = derived(view.documentStore, (state) => state.sections.section_id);
    const pinnedNodes = derived(
        view.documentStore,
        (state) => new Set(state.pinnedNodes.Ids),
    );
    const activeNodeId = derived(view.viewStore, (state) => state.document.activeNode);
    const editingState = derived(view.viewStore, (state) => state.document.editing);
    const selectedNodes = derived(
        view.viewStore,
        (state) => state.document.selectedNodes,
    );
    const nodeStyles = derived(
        view.viewStore,
        (state) => state.styleRules.nodeStyles,
    );

    const coreSlots = ['2', '3', '4', '5', '1', '6', '7', '8', '9'] as const;
    const childSlots = ['1', '2', '3', '4', null, '5', '6', '7', '8'] as const;

    const themeBlocks = [
        '2',
        '3',
        '4',
        '5',
        null,
        '6',
        '7',
        '8',
        '9',
    ] as const;

    let containerRef: HTMLElement | null = null;
    onMount(() => {
        view.container = containerRef;
        focusContainer(view);
    });

    const requireNodeId = (section: string) => {
        const nodeId = $sectionToNodeId[section];
        return nodeId || null;
    };
</script>

<div class="mandala-root">
    <div class="mandala-topbar">
        <button class="mandala-toggle" on:click={toggleMode}>
            {$mode === '3x3' ? '切换到 9×9' : '切换到 3×3'}
        </button>
    </div>

    <div class="mandala-scroll" bind:this={containerRef} tabindex="0">
        {#if $mode === '3x3'}
            <div class="mandala-grid mandala-grid--3 mandala-grid--core">
                {#each coreSlots as section (section)}
                    {@const nodeId = requireNodeId(section)}
                    {#if nodeId}
                        <MandalaCard
                            nodeId={nodeId}
                            {section}
                            active={nodeId === $activeNodeId}
                            editing={$editingState.activeNodeId === nodeId && !$editingState.isInSidebar}
                            selected={$selectedNodes.has(nodeId)}
                            pinned={$pinnedNodes.has(nodeId)}
                            style={$nodeStyles.get(nodeId)}
                            draggable={section !== '1'}
                        />
                    {:else}
                        <div class="mandala-empty">{section}</div>
                    {/if}
                {/each}
            </div>
        {:else}
            <div class="mandala-blocks">
                {#each themeBlocks as themeSection, i (i)}
                    <div
                        class={`mandala-block ${themeSection ? '' : 'mandala-block--center'}`}
                    >
                        {#if themeSection}
                            {@const themeNodeId = requireNodeId(themeSection)}
                            <div class="mandala-grid mandala-grid--3">
                                {#each childSlots as slot (slot)}
                                    {#if slot === null}
                                        {#if themeNodeId}
                                            <div class="mandala-mirror">
                                                <Content
                                                    nodeId={themeNodeId}
                                                    isInSidebar={false}
                                                    active={themeNodeId === $activeNodeId ? ActiveStatus.node : null}
                                                />
                                            </div>
                                        {:else}
                                            <div class="mandala-empty">{themeSection}</div>
                                        {/if}
                                    {:else}
                                        {@const section = `${themeSection}.${slot}`}
                                        {@const nodeId = requireNodeId(section)}
                                        {#if nodeId}
                                            <MandalaCard
                                                nodeId={nodeId}
                                                {section}
                                                active={nodeId === $activeNodeId}
                                                editing={$editingState.activeNodeId === nodeId && !$editingState.isInSidebar}
                                                selected={$selectedNodes.has(nodeId)}
                                                pinned={$pinnedNodes.has(nodeId)}
                                                style={$nodeStyles.get(nodeId)}
                                                draggable={true}
                                            />
                                        {:else}
                                            <div class="mandala-empty">{section}</div>
                                        {/if}
                                    {/if}
                                {/each}
                            </div>
                        {:else}
                            <div class="mandala-grid mandala-grid--3">
                                {#each coreSlots as section (section)}
                                    {@const nodeId = requireNodeId(section)}
                                    {#if nodeId}
                                        <MandalaCard
                                            nodeId={nodeId}
                                            {section}
                                            active={nodeId === $activeNodeId}
                                            editing={$editingState.activeNodeId === nodeId && !$editingState.isInSidebar}
                                            selected={$selectedNodes.has(nodeId)}
                                            pinned={$pinnedNodes.has(nodeId)}
                                            style={$nodeStyles.get(nodeId)}
                                            draggable={section !== '1'}
                                        />
                                    {:else}
                                        <div class="mandala-empty">{section}</div>
                                    {/if}
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .mandala-root {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        overflow: hidden;
    }

    .mandala-topbar {
        display: flex;
        justify-content: flex-end;
        padding: 8px;
        border-bottom: 1px solid var(--background-modifier-border);
        flex: 0 0 auto;
    }

    .mandala-toggle {
        padding: 6px 10px;
        border-radius: 8px;
        background: var(--interactive-normal);
        color: var(--text-normal);
        border: 1px solid var(--background-modifier-border);
        cursor: pointer;
    }

    .mandala-scroll {
        flex: 1 1 auto;
        overflow: auto;
        padding: 12px;
    }

    .mandala-blocks {
        display: grid;
        grid-template-columns: repeat(3, max-content);
        gap: calc(var(--cards-gap) * 2);
    }

    .mandala-grid {
        display: grid;
        grid-template-columns: repeat(3, var(--node-width));
        gap: var(--cards-gap);
        align-items: start;
    }

    /* 3×3 主视图：铺满可视区域（避免横向滚动） */
    .mandala-grid--core {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        align-items: stretch;
        justify-items: stretch;
    }

    .mandala-grid--core :global(.lineage-card),
    .mandala-grid--core .mandala-empty,
    .mandala-grid--core .mandala-mirror {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .mandala-empty,
    .mandala-mirror {
        width: var(--node-width);
        min-height: var(--min-node-height);
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        padding: 8px;
        opacity: 0.7;
        position: relative;
        background: var(--background-primary);
    }

    .mandala-mirror :global(.lng-prev) {
        pointer-events: auto;
    }
</style>
