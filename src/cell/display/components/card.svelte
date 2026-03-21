<script lang="ts">
    import { NodeId } from 'src/stores/document/document-state-type';
    import { ActiveStatus } from 'src/view/components/container/column/components/group/components/active-status.enum';
    import Content from 'src/cell/display/content/content.svelte';
    import InlineEditor from 'src/cell/display/content/inline-editor.svelte';
    import CardButtons
        from 'src/cell/interaction/buttons/card-buttons/card-buttons.svelte';
    import { NodeStyle } from 'src/stores/settings/types/style-rules-types';
    import clx from 'classnames';
    import CardStyle from 'src/cell/display/style/card-style.svelte';
    import TreeIndex
        from 'src/cell/interaction/buttons/tree-index-button.svelte';

    export let node: NodeId;
    export let editing: boolean;
    export let active: ActiveStatus | null;
    export let confirmDisableEdit: boolean;
    export let confirmDelete: boolean;
    export let section: string;
    export let selected: boolean;
    export let pinned: boolean;
    export let isInSidebar = false;
    export let isSearchMatch = false;
    export let style: NodeStyle | undefined;
    export let alwaysShowCardButtons: boolean;
    const activeStatusClasses = {
        [ActiveStatus.node]: 'active-node',
        [ActiveStatus.child]: 'active-child',
        [ActiveStatus.parent]: 'active-parent',
        [ActiveStatus.sibling]: 'active-sibling',
    };

</script>

<div
    class={clx(
        'mandala-card',
        active
            ? activeStatusClasses[active]
            : ' inactive-node',
        confirmDelete
            ? 'node-border--delete'
            : confirmDisableEdit
              ? 'node-border--discard'
              : editing
                ? 'node-border--editing'
                : selected
                  ? 'node-border--selected'
                  : isSearchMatch
                    ? 'node-border--search-match'
                    : active === ActiveStatus.node
                      ? 'node-border--active'
                      : undefined,
    )}
    id={node}
>
    {#if style}
        <CardStyle {style} />
    {/if}
    {#if active === ActiveStatus.node && editing}
        <InlineEditor nodeId={node} {style} />
    {:else}
        <Content nodeId={node} {isInSidebar} />
    {/if}

    <CardButtons
        {editing}
        nodeId={node}
        {isInSidebar}
        {active}
        {alwaysShowCardButtons}
    />
    <TreeIndex
        activeStatus={active}
        nodeId={node}
        {section}
        {pinned}
    />
</div>

<style>
    :root {
        --node-width: 400px;
        --min-node-height: 100px;
    }

    .mandala-card {
        width: var(--node-width);
        height: fit-content;
        display: flex;
        position: relative;
        font-size: 16px;
        --scrollbar-thumb-bg: var(--color-base-30);
        --scrollbar-active-thumb-bg: var(--color-base-40);
    }

    :global(.mandala-view:not(.mandala-white-theme)) .mandala-card:hover {
        z-index: 10;
    }

    .mandala-card::-webkit-scrollbar {
        display: initial;
    }

    /* .node-border--active,
    .node-border--discard,
    .node-border--delete,
    .node-border--selected,
    .node-border--search-match {
        & .node-style-container {
            border-left: 1px solid var(--background-active-node);
        }
    }*/

    /*  .node-border--editing {
        & .node-style-container {
            display: none;
        }
    }*/
    /* .debug-node-id {
        position: absolute;
        bottom: 0;
        right: 0;
        font-size: 12px;
        color: var(--text-on-accent);
        background-color: var(--color-accent);
    }*/
</style>
