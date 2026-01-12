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
    import { setActiveMainSplitNode } from 'src/view/components/container/column/components/group/components/card/components/content/store-actions/set-active-main-split-node';
    import { enableEditModeInMainSplit } from 'src/view/components/container/column/components/group/components/card/components/content/store-actions/enable-edit-mode-in-main-split';
    import { 
        ShowMandalaDetailSidebarStore,
        // AlwaysShowCardButtons,
        OutlineModeStore
    } from 'src/stores/settings/derived/view-settings-store';
    // import CardButtons from 'src/view/components/container/column/components/group/components/card/components/card-buttons/card-buttons/card-buttons.svelte';
    import { derived } from 'src/lib/store/derived';

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
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    // const alwaysShowCardButtons = AlwaysShowCardButtons(view);
    const outlineMode = OutlineModeStore(view);

    const hasChildrenStore = derived(view.documentStore, (state) => {
        const section = state.sections.id_section[nodeId];
        if (!section) return false;
        return Object.keys(state.sections.section_id).some((s) =>
            s.startsWith(section + '.'),
        );
    });

    const collapsedStore = derived(view.viewStore, (state) =>
        state.outline.collapsedParents.has(nodeId),
    );

    const handleSelect = (e: MouseEvent) => {
        if (gridCell) {
            view.mandalaActiveCell9x9 = { row: gridCell.row, col: gridCell.col };
        }
        setActiveMainSplitNode(view, nodeId, e);
        const maintainEditMode =
            view.plugin.settings.getValue().view.maintainEditMode;
        if (maintainEditMode && $showDetailSidebar) {
            view.viewStore.dispatch({
                type: 'view/editor/enable-main-editor',
                payload: { nodeId: nodeId, isInSidebar: true },
            });
        }
    };
</script>

<div
    class={clx(
        'lineage-card',
        active ? 'active-node' : 'inactive-node',
        selected ? 'node-border--selected' : undefined,
        pinned ? 'node-border--pinned' : undefined,
        active ? 'node-border--active' : undefined,
        // $alwaysShowCardButtons ? 'always-show-buttons' : undefined,
    )}
    id={nodeId}
    use:droppable
    on:click={handleSelect}
    on:dblclick={(e) => {
        handleSelect(e);
        if ($showDetailSidebar) {
            view.viewStore.dispatch({
                type: 'view/editor/enable-main-editor',
                payload: { nodeId: nodeId, isInSidebar: true },
            });
        } else {
            enableEditModeInMainSplit(view, nodeId);
        }
    }}
>
    {#if style}
        <CardStyle {style} />
    {/if}

    {#if active && editing && !$showDetailSidebar}
        <InlineEditor nodeId={nodeId} {style} />
    {:else if draggable}
        <Draggable nodeId={nodeId} isInSidebar={false}>
            <Content nodeId={nodeId} isInSidebar={false} active={active ? ActiveStatus.node : null} />
        </Draggable>
    {:else}
        <Content nodeId={nodeId} isInSidebar={false} active={active ? ActiveStatus.node : null} />
    {/if}
    
    <!-- <CardButtons
        {editing}
        {nodeId}
        hasChildren={$hasChildrenStore}
        isInSidebar={false}
        collapsed={$collapsedStore}
        active={active ? ActiveStatus.node : null}
        alwaysShowCardButtons={$alwaysShowCardButtons}
        outlineMode={$outlineMode}
    /> -->

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

    /* .lineage-card.always-show-buttons :global(.lineage-floating-button) {
        opacity: var(--opacity-inactive-node) !important;
    }

    .lineage-card.always-show-buttons.active-node :global(.lineage-floating-button) {
        opacity: var(--opacity-active-node) !important;
    } */
</style>
