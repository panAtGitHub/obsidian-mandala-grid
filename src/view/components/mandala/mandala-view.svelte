<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { derived } from 'src/lib/store/derived';
    import { getView } from 'src/view/components/container/context';
    import MandalaCard from 'src/view/components/mandala/mandala-card.svelte';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
    import {
        childSlots,
        coreSlots,
        posOfSection9x9,
        sectionAtCell9x9,
        themeBlocks,
    } from 'src/view/helpers/mandala/mandala-grid';

    const view = getView();

    const mode = writable<'3x3' | '9x9'>('3x3');
    const toggleMode = () => {
        mode.update((m) => (m === '3x3' ? '9x9' : '3x3'));
    };

    $: view.mandalaMode = $mode;

    const sectionToNodeId = derived(
        view.documentStore,
        (state) => state.sections.section_id,
    );
    const idToSection = derived(
        view.documentStore,
        (state) => state.sections.id_section,
    );
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

    let containerRef: HTMLElement | null = null;
    onMount(() => {
        view.container = containerRef;
        focusContainer(view);
    });

    const requireNodeId = (section: string) => {
        const nodeId = $sectionToNodeId[section];
        return nodeId || null;
    };

    $: {
        if ($mode !== '9x9') {
            view.mandalaActiveCell9x9 = null;
        } else {
            const section = $idToSection[$activeNodeId];
            if (!section) {
                view.mandalaActiveCell9x9 = null;
            } else {
                const cell = view.mandalaActiveCell9x9;
                const mapped = cell
                    ? sectionAtCell9x9(cell.row, cell.col)
                    : null;
                if (mapped !== section) {
                    view.mandalaActiveCell9x9 = posOfSection9x9(section);
                }
            }
        }
    }
</script>

<div
    class="mandala-root"
    class:mandala-root--3={$mode === '3x3'}
    class:mandala-root--9={$mode === '9x9'}
>
    <div class="mandala-topbar">
        <button class="mandala-toggle" on:click={toggleMode}>
            {$mode === '3x3' ? '切换到 9×9' : '切换到 3×3'}
        </button>
    </div>

    <div
        class="mandala-scroll"
        bind:this={containerRef}
        tabindex="0"
        on:click={() => focusContainer(view)}
    >
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
                    {@const blockRow = Math.floor(i / 3)}
                    {@const blockCol = i % 3}
                    <div
                        class={`mandala-block ${themeSection ? '' : 'mandala-block--center'}`}
                    >
                        {#if themeSection}
                            {@const themeNodeId = requireNodeId(themeSection)}
                            <div class="mandala-grid mandala-grid--3">
                                {#each childSlots as slot, j (slot)}
                                    {@const localRow = Math.floor(j / 3)}
                                    {@const localCol = j % 3}
                                    {@const row = blockRow * 3 + localRow}
                                    {@const col = blockCol * 3 + localCol}
                                    {#if slot === null}
                                        {#if themeNodeId}
                                            <MandalaCard
                                                nodeId={themeNodeId}
                                                section={themeSection}
                                                gridCell={{ mode: '9x9', row, col }}
                                                active={themeNodeId === $activeNodeId}
                                                editing={$editingState.activeNodeId === themeNodeId && !$editingState.isInSidebar}
                                                selected={$selectedNodes.has(themeNodeId)}
                                                pinned={$pinnedNodes.has(themeNodeId)}
                                                style={$nodeStyles.get(themeNodeId)}
                                                draggable={true}
                                            />
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
                                                gridCell={{ mode: '9x9', row, col }}
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
                                {#each coreSlots as section, j (section)}
                                    {@const localRow = Math.floor(j / 3)}
                                    {@const localCol = j % 3}
                                    {@const row = blockRow * 3 + localRow}
                                    {@const col = blockCol * 3 + localCol}
                                    {@const nodeId = requireNodeId(section)}
                                    {#if nodeId}
                                        <div class="mandala-center-cell" data-section={section}></div>
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
        --mandala-core-gap: clamp(10px, 1vw, 18px);
        --mandala-gap: calc(var(--mandala-core-gap) / 4);
        --mandala-block-gap: var(--mandala-gap);
        --mandala-card-width: 100%;
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
        gap: var(--mandala-block-gap);
        justify-content: center;
        align-content: start;
    }

    .mandala-grid {
        display: grid;
        grid-template-columns: repeat(3, var(--node-width));
        gap: var(--mandala-gap);
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

    .mandala-root--3 {
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--3 .mandala-empty,
    .mandala-root--3 .mandala-mirror {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    /* 9×9：格子约等于 3×3 的 1/3，并铺满屏幕 */
    .mandala-root--9 {
        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--9 .mandala-blocks {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        justify-content: stretch;
        align-content: stretch;
    }

    .mandala-root--9 .mandala-block {
        width: 100%;
        height: 100%;
    }

    .mandala-root--9 .mandala-grid {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        align-items: stretch;
    }

    .mandala-root--9 .mandala-empty,
    .mandala-root--9 .mandala-mirror {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .mandala-root--9 :global(.lng-prev) {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
        overflow: auto;
    }

    .mandala-root--9 :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    .mandala-root--9 :global(.draggable),
    .mandala-root--9 :global(.draggable .content) {
        height: 100%;
    }

    /* 3×3：内容超出时在格子内部滚动（避免撑开格子） */
    .mandala-root--3 :global(.lng-prev) {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
        overflow: auto;
    }

    .mandala-root--3 :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    .mandala-root--3 :global(.draggable),
    .mandala-root--3 :global(.draggable .content) {
        height: 100%;
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

    .mandala-center-cell {
        width: 100%;
        height: 100%;
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        opacity: 0.35;
        pointer-events: none;
    }
</style>
