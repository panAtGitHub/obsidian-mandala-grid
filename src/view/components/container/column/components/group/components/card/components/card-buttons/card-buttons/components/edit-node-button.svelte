<script lang="ts">
    import { PencilIcon, SaveIcon } from 'lucide-svelte';
    import { getView } from '../../../../../../../../../context';
    import FloatingButton from '../../shared/floating-button.svelte';
    import { lang } from '../../../../../../../../../../../../lang/lang';
    import {
        enableEditModeInSidebar
    } from 'src/view/components/container/column/components/group/components/card/components/content/store-actions/enable-edit-mode-in-sidebar';
    import {
        enableEditModeInMainSplit
    } from 'src/view/components/container/column/components/group/components/card/components/content/store-actions/enable-edit-mode-in-main-split';
    import {
        saveNodeContent
    } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';

    export let editing: boolean;
    export let nodeId: string;
    export let isInSidebar: boolean;
    const view = getView();
    const viewStore = view.viewStore;

    const enableEditMode = (e: MouseEvent) => {
        e.stopPropagation();
        if (isInSidebar) {
            enableEditModeInSidebar(view, nodeId);
        } else {
            enableEditModeInMainSplit(view, nodeId);
        }
    };

    const saveNode = (e: MouseEvent) => {
        e.stopPropagation();
        saveNodeContent(view);
    };

    const handleClick = (e: MouseEvent) => {
        if (editing) {
            saveNode(e);
        } else {
            enableEditMode(e);
        }
    };
</script>

<FloatingButton
    label={editing ? lang.card_btn_save : lang.card_btn_edit}
    on:click={handleClick}
    position="down-right"
>
    {#if editing}
        <SaveIcon class="svg-con" />
    {:else}
        <PencilIcon class="svg-icon" />
    {/if}
</FloatingButton>
