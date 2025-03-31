<script lang="ts">
    import SnapshotButton from './components/snapshot-button.svelte';
    import { updateRelativeTime } from '../../../../actions/update-relative-time';
    import { historyStore } from '../../../../../stores/document/derived/history-store';
    import { getView } from '../../context';

    const view = getView();
    const history = historyStore(view)
</script>

<div class="lineage-modal snapshots-modal" style="padding-left: 0; padding-right:0" tabindex="0">
    <div
        class="snapshots-list"
        use:updateRelativeTime
    >
        {#each [...$history.items].sort((a, b) => b.created - a.created) as snapshot, index (snapshot.id)}
            <SnapshotButton
                {snapshot}
                active={$history.items.length - index - 1 ===
                    $history.state.activeIndex}
            />
        {/each}
    </div>
</div>

<style>


    .snapshots-list {
        width: 400px;
        display: flex;
        flex-direction: column;
        gap:  var(--size-4-2);
        height: fit-content;
        max-height: 400px;
        overflow-y: auto;
        padding-left: var(--size-4-2);
        padding-right: var(--size-4-2);
    }
    .snapshots-modal{
        left: var(--size-4-2);
        top: 50px;
    }
    @media (max-width: 720px) {
        .snapshots-list {
            width: initial;
        }
    }
</style>
