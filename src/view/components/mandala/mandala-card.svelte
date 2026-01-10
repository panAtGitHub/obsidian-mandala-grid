<script lang="ts">
    import clx from 'classnames';
    import { ActiveStatus } from 'src/view/components/container/column/components/group/components/active-status.enum';
    import Content from 'src/view/components/container/column/components/group/components/card/components/content/content.svelte';
    import InlineEditor from 'src/view/components/container/column/components/group/components/card/components/content/inline-editor.svelte';
    import Draggable from 'src/view/components/container/column/components/group/components/card/components/dnd/draggable.svelte';
    import CardStyle from 'src/view/components/container/column/components/group/components/card/components/card-style.svelte';
    import { droppable } from 'src/view/actions/dnd/droppable';
    import { NodeStyle } from 'src/stores/settings/types/style-rules-types';
    import { getView } from 'src/view/components/container/context';

    export let nodeId: string;
    export let section: string;
    export let active: boolean;
    export let editing: boolean;
    export let selected: boolean;
    export let pinned: boolean;
    export let style: NodeStyle | undefined;
    export let draggable: boolean;
    export let gridCell: { mode: '9x9'; row: number; col: number } | null = null;

    const view = getView();
</script>

<div
    class={clx(
        'lineage-card',
        active ? 'active-node' : 'inactive-node',
        selected ? 'node-border--selected' : undefined,
        pinned ? 'node-border--pinned' : undefined,
        active ? 'node-border--active' : undefined,
    )}
    id={nodeId}
    use:droppable
    on:click={() => {
        if (gridCell) {
            view.mandalaActiveCell9x9 = {
                row: gridCell.row,
                col: gridCell.col,
            };
        }
    }}
>
    {#if style}
        <CardStyle {style} />
    {/if}

    {#if active && editing}
        <InlineEditor nodeId={nodeId} {style} />
    {:else if draggable}
        <Draggable nodeId={nodeId} isInSidebar={false}>
            <Content nodeId={nodeId} isInSidebar={false} active={active ? ActiveStatus.node : null} />
        </Draggable>
    {:else}
        <Content nodeId={nodeId} isInSidebar={false} active={active ? ActiveStatus.node : null} />
    {/if}

    <div class="mandala-section-label">{section}</div>
</div>

<style>
    .lineage-card {
        width: var(--mandala-card-width, var(--node-width));
        min-height: var(--mandala-card-min-height, var(--min-node-height));
        height: var(--mandala-card-height, fit-content);
        display: flex;
        flex-direction: column;
        position: relative;
        font-size: 16px;
        overflow: var(--mandala-card-overflow, visible);
        --scrollbar-thumb-bg: var(--color-base-30);
        --scrollbar-active-thumb-bg: var(--color-base-40);
    }

    .lineage-card:hover {
        z-index: 10;
    }

    .mandala-section-label {
        position: absolute;
        top: 6px;
        right: 8px;
        font-size: 12px;
        opacity: 0.7;
        user-select: none;
        pointer-events: none;
    }
</style>
