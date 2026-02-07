<script lang="ts">
    import { getModalState } from 'src/view/modals/split-node-modal/helpers/get-modal-state';

    const state = getModalState();

    const mode = state.mode;
    const content = state.content;
</script>

<div>
    {#if !$mode}
        <p class="mod-warning">
            This section does not match any splitting pattern
        </p>
    {/if}
</div>
<div class="preview">
    {@html $content}
</div>

<style>
    .preview {
        flex-grow: 1;
        max-height: 500px;
        overflow: auto;
    }
</style>
