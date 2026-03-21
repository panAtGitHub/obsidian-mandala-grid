<script lang="ts">
    import { ActiveStatus } from 'src/views/view-columns/components/active-status.enum';
    import { getView } from 'src/view/components/container/context';
    import {
        findSectionPosition
    } from 'src/cell/interaction/buttons/helpers/find-section-position';
    import {
        openFileAndJumpToLine
    } from 'src/cell/interaction/buttons/helpers/openFileAndJumpToLine';
    import { lang } from 'src/lang/lang';
    import Pin from './pin-indicator.svelte';

    const view = getView();
    export let nodeId: string;
    export let activeStatus: ActiveStatus | null;
    export let section: string;
    export let pinned: boolean;
    const openFile = async () => {
        if (!view.file) return;

        const i = findSectionPosition(view, nodeId);
        if (typeof i === 'undefined') return;
        const targetLine = i + 1;
        const lines = view.data.split('\n');
        const nextLine = lines[targetLine] || '';
        await openFileAndJumpToLine(view, targetLine, nextLine.length);
    };
    const classes: Partial<Record<ActiveStatus, string>> = {
        [ActiveStatus.node]: 'is-active',
        [ActiveStatus.child]: 'is-active-child',
        [ActiveStatus.parent]: 'is-active-parent',
        [ActiveStatus.sibling]: 'is-active-parent',
    };
</script>

<div class={'tree-index ' + (activeStatus ? classes[activeStatus] : '')}>
    {#if pinned}
        <Pin />
    {/if}
    <span aria-label={lang.card_btn_reveal_in_editor} on:click={openFile}>
        {section}
    </span>
</div>

<style>
    .tree-index {
        position: absolute;
        bottom: 3px;
        right: 8px;
        opacity: 0.8;
        font-size: 12px;
        cursor: pointer;

    }
    .is-active {
        opacity: 0.3;
    }

    .is-active-child {
        opacity: 0.3;
    }

    .is-active-parent {
        opacity: 0.6;
    }



</style>
