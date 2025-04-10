<script lang="ts">
    import { relativeTime } from '../../../../../../helpers/relative-time';
    import { snapshotActionLang } from '../../../../../../lang/snapshot-action-lang';
    import { Snapshot } from '../../../../../../stores/document/document-state-type';
    import { getView } from '../../../context';
    import { Notice } from 'obsidian';
    import invariant from 'tiny-invariant';
    import { lang } from '../../../../../../lang/lang';

    export let snapshot: Snapshot;
    export let active: boolean;

    const view = getView();
    const documentStore = view.documentStore;
    const viewStore = view.viewStore;
    const infoFactory = snapshotActionLang[snapshot.context.action.type];
    invariant(infoFactory);
    const info = infoFactory(snapshot);

    const numberOfCharacters = snapshot.context.numberOfCharacters;
    const numberOfSections = snapshot.context.numberOfSections;
    const sections = `${numberOfSections} section${
        numberOfSections === 1 ? '' : 's'
    }`;
    const chars = `${numberOfCharacters} char${numberOfCharacters === 1 ? '' : 's'}`;
</script>

<div
    aria-label={snapshot.context.contentOfAffectedSection}
    class="snapshot"
    class:selected={active}
    on:click={() => {
        if (viewStore.getValue().document.editing.activeNodeId)
            new Notice(lang.error_apply_snapshot_while_editing);
        else
            documentStore.dispatch({
                type: 'document/history/select-snapshot',
                payload: { snapshotId: snapshot.id },
            });
    }}
>
    <div class="icon-wrapper">
        {#if 'iconHtml' in info}
            {@html info.iconHtml}
        {:else}
            <svelte:component this={info.icon} class="svg-icon label" />
        {/if}
    </div>
    <div class="snapshot-content">
        <div class="snapshot-body">
            <div class="snapshot-label">
                {info.label}
            </div>
        </div>
        <div class="snapshot-card-content">
            {snapshot.context.contentOfAffectedSection}
        </div>
    </div>
    <div class="snapshot-context">
        <span class="snapshot-section-number">{sections} </span>
        <span class="snapshot-section-number">{chars}</span>
        <span class="snapshot-time" data-created={snapshot.created}>
            {relativeTime(snapshot.created)}
        </span>
    </div>
</div>

<style>
    :root {
        --icon-wrapper-width: 32px;
    }
    .snapshot {
        padding: var(--size-4-2);
        cursor: pointer;
        display: flex;
        align-items: center;
        border-radius: 4px;
        gap: 4px;
        height: 66px;
       flex:1;
        background-color: var(--background-secondary);
    }

    .selected {
        background-color: var(--nav-item-background-selected);
    }

    .icon-wrapper {
        width: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .snapshot-content {
        display: flex;
        flex-direction: column;
        gap: 5px;
        flex: 1;
    }

    .snapshot-body {
        display: flex;
        justify-content: space-between;
        gap: 5px;
        width: 100%;
    }

    .snapshot-label {
        font-size: 14px;
        color: var(--color-base-70);
        display: block;
        flex: 1;
        max-width: 210px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .snapshot-card-content {
        font-size: 14px;
        color: var(--color-base-60);
        display: block;
        white-space: nowrap;
        overflow: hidden;
        max-width: 200px;
        text-overflow: ellipsis;
        font-style: italic;
        opacity: 0.9;
    }
    @media (max-width: 720px) {
        .snapshot-card-content {
            max-width: 30vw;
        }
    }

    .snapshot-context {
        display: flex;
        flex-direction: column;
        align-items: end;
        height: 100%;
        justify-content: space-between;
    }
    .snapshot-section-number {
        font-size: 11px;
        color: var(--color-base-60);
        min-width: 16px;
        text-align: left;
        margin-left: auto;
    }
    .snapshot-time {
        font-size: 11px;
        color: var(--color-base-60);
    }
</style>
