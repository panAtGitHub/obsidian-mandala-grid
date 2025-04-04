<script lang="ts">
    import { getView } from 'src/view/components/container/context';

    export let parentId: string;
    export let index: number;
    export let section: string;
    export let content: string;
    const view = getView();
    const viewStore = view.viewStore;
    const onClick = () => {
        viewStore.dispatch({
            type: 'view/set-active-node/mouse',
            payload: { id: parentId },
        });
    };
</script>

{#if index > 0}
    <span class="separator">/</span>
{/if}

<span
    aria-label={section+"\n"+content}
    class={`breadcrumbs-item ${content?'':'section-number'}`}
    data-tooltip-position="top"
    on:click={onClick}
>
    {content || section}
</span>

<style>
    .separator {
        padding: 2px 1px;
        color: var(--text-faint);
        min-width: 8px;
    }
    .breadcrumbs-item {
        height: 30px;
        color: var(--text-muted);
        cursor: pointer;
        padding: 2px 8px;
        max-width: 350px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px;
        line-height: 25px;
    }

    .breadcrumbs-item:hover {
        background-color: var(--interactive-hover);
    }
    .breadcrumbs-item:last-child {
        border-bottom: none;
    }

    .section-number{
        font-style: italic;
        color: var(--text-faint);
    }
</style>
