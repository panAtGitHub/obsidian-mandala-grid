<script lang="ts">
    import { TrashIcon } from 'lucide-svelte';
    import { getView } from '../../../../../../../../../context';
    import FloatingButton from '../../shared/floating-button.svelte';
    import {
        deleteNode
    } from '../../../../../../../../../../../actions/keyboard-shortcuts/helpers/commands/commands/helpers/delete-node';
    import { lang } from '../../../../../../../../../../../../lang/lang';

    export let nodeId: string;
    const view = getView();

     
    const _deleteNode = (e: MouseEvent) => {
        e.stopPropagation();
        deleteNode(view, nodeId);
    };
</script>

<FloatingButton label={lang.card_btn_delete} on:click={_deleteNode} position="up-right" classes="delete-card-button">
    <TrashIcon class="svg-con" />
</FloatingButton>
