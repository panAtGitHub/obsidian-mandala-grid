<script lang="ts">
    import { getView } from '../../../../../../../../../context';
    import FloatingButton from '../../shared/floating-button.svelte';
    import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-svelte';
    import {
        saveNodeAndInsertNode
    } from '../../../../../../../../../../../actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-and-insert-node';
    import { Direction } from '../../../../../../../../../../../../stores/document/document-store-actions';
    import { lang } from '../../../../../../../../../../../../lang/lang';

    export let nodeId : string;
    export let position: Direction;
    const view = getView();
     
    const createCard = (e: MouseEvent) => {
        e.stopPropagation();
        saveNodeAndInsertNode(view, position, undefined, nodeId);
    };
    const chevrons = {
        right: ChevronRight,
        up: ChevronUp,
        down: ChevronDown,
    };
    const label: Record<Direction, string> = {
        "up":lang.card_btn_add_node_above,
        "down":lang.card_btn_add_node_below,
        "right":lang.card_btn_add_child_node
    }
</script>

<FloatingButton label={label[position]} on:click={createCard} {position}>
    <svelte:component this={chevrons[position]}></svelte:component>
</FloatingButton>

<style>
</style>
