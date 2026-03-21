<script lang="ts">
    import { NodeId } from 'src/stores/document/document-state-type';
    import { ActiveStatus } from 'src/views/view-columns/components/active-status.enum';
    import CardMainContent from 'src/cell/display/components/card-main-content.svelte';
    import CardButtons
        from 'src/cell/interaction/buttons/card-buttons/card-buttons.svelte';
    import { NodeStyle } from 'src/stores/settings/types/style-rules-types';
    import CardStyle from 'src/cell/display/style/card-style.svelte';
    import TreeIndex
        from 'src/cell/interaction/buttons/tree-index-button.svelte';
    import { buildClassicCardClassName } from 'src/cell/model/build-classic-card-class-name';
    import { buildClassicCardRenderModel } from 'src/cell/model/build-classic-card-render-model';
    import type { ClassicCardRenderModel } from 'src/cell/model/card-render-model';

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
    let renderModel: ClassicCardRenderModel;
    let cardClassName = '';

    $: renderModel = buildClassicCardRenderModel({
        active,
        editing,
        style,
    });

    $: cardClassName = buildClassicCardClassName({
        active,
        confirmDelete,
        confirmDisableEdit,
        editing,
        selected,
        isSearchMatch,
    });
</script>

<div
    class={cardClassName}
    id={node}
>
    {#if renderModel.style}
        <CardStyle {style} />
    {/if}

    <CardMainContent
        nodeId={node}
        {style}
        {isInSidebar}
        showInlineEditor={renderModel.showInlineEditor}
        showContent={renderModel.showContent}
    />

    {#if renderModel.showCardButtons}
        <CardButtons
        {editing}
        nodeId={node}
        {isInSidebar}
        {active}
        {alwaysShowCardButtons}
        />
    {/if}
    {#if renderModel.showTreeIndex}
        <TreeIndex
            activeStatus={active}
            nodeId={node}
            {section}
            {pinned}
        />
    {/if}
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
