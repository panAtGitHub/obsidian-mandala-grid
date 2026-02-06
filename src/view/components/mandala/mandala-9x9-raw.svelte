<script lang="ts">
    import { derived } from 'src/lib/store/derived';
    import { getView } from 'src/view/components/container/context';
    import { onDestroy } from 'svelte';
    import Content from 'src/view/components/container/column/components/group/components/card/components/content/content.svelte';
    import InlineEditor from 'src/view/components/container/column/components/group/components/card/components/content/inline-editor.svelte';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
    import { Platform } from 'obsidian';
    import {
        nextRaw9x9Cell,
        posOfRaw9x9Section,
        sectionAtRaw9x9Cell,
        type MandalaCell,
    } from 'src/view/helpers/mandala/mandala-9x9-raw';
    import { enableEditModeInMainSplit } from 'src/view/components/container/column/components/group/components/card/components/content/store-actions/enable-edit-mode-in-main-split';
    import { setActiveCell9x9 } from 'src/view/helpers/mandala/set-active-cell-9x9';

    const view = getView();

    const sectionToNodeId = derived(
        view.documentStore,
        (state) => state.sections.section_id,
    );
    const idToSection = derived(
        view.documentStore,
        (state) => state.sections.id_section,
    );
    const activeNodeId = derived(view.viewStore, (state) => state.document.activeNode);
    const editingState = derived(view.viewStore, (state) => state.document.editing);
    const baseTheme = '1';

    export let containerRef: HTMLElement | null = null;

    let activeCell: MandalaCell | null = null;

    const resolveCellFromActiveNode = () => {
        const section = $idToSection[$activeNodeId];
        if (!section) return null;
        return posOfRaw9x9Section(section, 'left-to-right', baseTheme);
    };

    $: {
        if (view.mandalaMode !== '9x9') {
            activeCell = null;
        } else {
            const mapped = resolveCellFromActiveNode();
            if (mapped) activeCell = mapped;
            else if (!activeCell) activeCell = { row: 0, col: 0 };
        }
    }

    const selectCell = (cell: MandalaCell) => {
        const section = sectionAtRaw9x9Cell(
            cell.row,
            cell.col,
            'left-to-right',
            baseTheme,
        );
        if (!section) return;
        const nodeId = $sectionToNodeId[section];
        if (!nodeId) return;
        activeCell = cell;
        setActiveCell9x9(view, cell);
        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse',
            payload: { id: nodeId },
        });
    };

    const ensureFocus = () => {
        focusContainer(view);
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (view.mandalaMode !== '9x9') return;
        if ($editingState.activeNodeId) return;
        if (
            event.key !== 'ArrowUp' &&
            event.key !== 'ArrowDown' &&
            event.key !== 'ArrowLeft' &&
            event.key !== 'ArrowRight'
        ) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) {
            activeCell = resolveCellFromActiveNode() ?? { row: 0, col: 0 };
        }
        const dir =
            event.key === 'ArrowUp'
                ? 'up'
                : event.key === 'ArrowDown'
                  ? 'down'
                  : event.key === 'ArrowLeft'
                    ? 'left'
                    : 'right';
        const next = activeCell ? nextRaw9x9Cell(activeCell, dir) : null;
        if (!next) return;
        selectCell(next);
    };

    let keyTarget: HTMLElement | null = null;
    const attachKeyTarget = (el: HTMLElement) => {
        el.addEventListener('keydown', onKeydown, { capture: true });
        keyTarget = el;
    };
    const detachKeyTarget = () => {
        if (!keyTarget) return;
        keyTarget.removeEventListener('keydown', onKeydown, { capture: true } as never);
        keyTarget = null;
    };

    $: {
        if (containerRef !== keyTarget) {
            detachKeyTarget();
            if (containerRef) attachKeyTarget(containerRef);
        }
    }

    onDestroy(() => {
        detachKeyTarget();
    });
</script>

<div class="mandala-raw9">
    {#each Array(9) as _rowPlaceholder, row (row)}
        {#each Array(9) as _colPlaceholder, col (col)}
            {@const section = sectionAtRaw9x9Cell(
                row,
                col,
                'left-to-right',
                baseTheme,
            )}
            {@const nodeId = section ? $sectionToNodeId[section] : null}
            {@const isActive = activeCell?.row === row && activeCell?.col === col}
            <div
                class="mandala-raw9-cell"
                class:mandala-raw9-cell--virtual={!section}
                class:mandala-raw9-cell--active={Boolean(section && isActive)}
                on:click={() => {
                    ensureFocus();
                    if (!section) return;
                    selectCell({ row, col });
                }}
                on:dblclick={() => {
                    ensureFocus();
                    if (Platform.isMobile) return;
                    if (!section || !nodeId) return;
                    selectCell({ row, col });
                    enableEditModeInMainSplit(view, nodeId);
                }}
            >
                {#if section && nodeId}
                    {#if $editingState.activeNodeId === nodeId && !$editingState.isInSidebar}
                        <InlineEditor nodeId={nodeId} style={undefined} />
                    {:else}
                        <div class="mandala-raw9-preview">
                            <Content nodeId={nodeId} isInSidebar={false} active={null} />
                        </div>
                    {/if}
                    <div class="mandala-raw9-label">{section}</div>
                {:else if section}
                    <div class="mandala-raw9-label">{section}</div>
                {/if}
            </div>
        {/each}
    {/each}
</div>

<style>
    .mandala-raw9 {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(9, minmax(0, 1fr));
        grid-template-rows: repeat(9, minmax(0, 1fr));
        gap: var(--mandala-gap);
    }

    .mandala-raw9-cell {
        position: relative;
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        overflow: hidden;
        background: var(--background-primary);
        min-height: 0;
        min-width: 0;
    }

    .mandala-raw9-cell--virtual {
        opacity: 0.25;
        border-style: dashed;
        background: transparent;
        pointer-events: none;
    }

    .mandala-raw9-cell--active {
        outline: 2px solid var(--mandala-accent);
        outline-offset: -2px;
    }

    .mandala-raw9-preview {
        height: 100%;
        display: flex;
        min-height: 0;
        min-width: 0;
    }

    .mandala-raw9-preview :global(.lng-prev) {
        height: 100%;
        overflow: auto;
        pointer-events: none;
    }

    .mandala-raw9-preview :global(.editor-container) {
        height: 100%;
        overflow: auto;
    }

    .mandala-raw9-label {
        position: absolute;
        top: 6px;
        right: 8px;
        font-size: 12px;
        opacity: 0.6;
        user-select: none;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.03);
        padding: 2px 6px;
        border-radius: 6px;
    }
</style>
