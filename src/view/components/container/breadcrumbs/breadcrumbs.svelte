<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import Item from './breadcrumbs-item.svelte';
    import { activeBranchStore } from 'src/stores/view/derived/active-branch-store';
    import { documentContentStore } from 'src/stores/document/derived/content-store';
    import { IdSectionStore } from 'src/stores/document/derived/id-section-store';

    const view = getView();
    const activeBranch = activeBranchStore(view);
    const contents = documentContentStore(view);
    const sections = IdSectionStore(view)
</script>

<div class="breadcrumbs-container">
    <div class="breadcrumbs">
        {#each $activeBranch.sortedParentNodes as parentId, index (parentId)}
            <Item {parentId} {index} content={$contents[parentId]?.content} section={$sections[parentId]} />
        {/each}
    </div>
</div>

<style>

    .breadcrumbs-container {
        z-index: var(--z-index-breadcrumbs);
        left: 0;
        bottom: 0;
        display: flex;
        position: absolute;
        max-width: calc(100% - var(--size-4-2) * 2 - 34px);
    }
    .breadcrumbs {
        display: flex;
        align-items: center;
        justify-content: center;
        border-style: solid;
        border-width: 1px 1px 0 0;
        border-color: var(--status-bar-border-color);
        border-radius: 0 6px 0 0;
        background-color:var(--status-bar-background);

        max-width: 100%;
        overflow: hidden;
        font-size: var(--file-header-font-size);
        color: var(--text-muted);
        gap: 0;
    }
</style>
