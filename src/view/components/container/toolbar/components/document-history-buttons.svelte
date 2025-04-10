<script lang="ts">
    import { lang } from '../../../../../lang/lang';
    import { HistoryIcon, Redo2 as RedoIcon, Undo2 as UndoIcon } from 'lucide-svelte';
    import Button from '../../shared/button.svelte';
    import { historyStore } from '../../../../../stores/document/derived/history-store';
    import { getView } from '../../context';
    import { Notice } from 'obsidian';
    import { LineageView } from 'src/view/view';

    const view = getView();
    const history = historyStore(view);

    const isEditing = (view: LineageView) =>
        view.viewStore.getValue().document.editing.activeNodeId;

    const toggleSnapshotsModal = () =>
        view.viewStore.dispatch({
            type: 'view/snapshots/toggle-modal',
        });

    const selectNextSnapshot = () => {
        if (isEditing(view))
            new Notice(lang.error_apply_snapshot_while_editing);
        else
            view.documentStore.dispatch({
                type: 'document/history/select-next-snapshot',
            });
    };

    const selectPreviousSnapshot = () => {
        if (isEditing(view))
            new Notice(lang.error_apply_snapshot_while_editing);
        else
            view.documentStore.dispatch({
                type: 'document/history/select-previous-snapshot',
            });
    };
</script>

<div class="navigation-history buttons-group">
    <Button
        disabled={$history.items.length === 0}
        label={lang.controls_history}
        on:click={toggleSnapshotsModal}
        tooltipPosition="bottom"
    >
        <HistoryIcon class="svg-icon" size="12" />
    </Button>
    <Button
        disabled={!$history.state.canGoBack}
        label={lang.controls_history_undo}
        on:click={selectPreviousSnapshot}
        tooltipPosition="bottom"
    >
        <UndoIcon class="svg-icon" size="12" />
    </Button>
    <Button
        disabled={!$history.state.canGoForward}
        label={lang.controls_history_redo}
        on:click={selectNextSnapshot}
        tooltipPosition="bottom"
    >
        <RedoIcon class="svg-icon" size="12" />
    </Button>
</div>

<style>
    .navigation-history {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
