<script lang="ts">
    import { getView } from '../../../../../../../context';
    import { ActiveStatus } from 'src/view/components/container/column/components/group/components/active-status.enum';
    import { getPersistedDocumentFormat } from 'src/obsidian/events/workspace/helpers/get-persisted-document-format';
    import {
        findSectionPosition
    } from 'src/view/components/container/column/components/group/components/card/components/card-buttons/helpers/find-section-position';
    import {
        findOutlinePosition
    } from 'src/view/components/container/column/components/group/components/card/components/card-buttons/helpers/find-outline-position';
    import {
        openFileAndJumpToLine
    } from 'src/view/components/container/column/components/group/components/card/components/card-buttons/helpers/openFileAndJumpToLine';
    import {
        findHtmlElementPosition
    } from 'src/view/components/container/column/components/group/components/card/components/card-buttons/helpers/find-html-element-position';
    import { lang } from 'src/lang/lang';
    import Pin from './pin-indicator.svelte';

    const view = getView();
    export let nodeId: string;
    export let activeStatus: ActiveStatus | null;
    export let section: string;
    export let pinned: boolean;

     
    const openFile = async () => {
        if (!view.file) return;

        const format = getPersistedDocumentFormat(view);
        const i =
            format === 'sections'
                ? findSectionPosition(view, nodeId)
                : format === 'html-element'
                  ? findHtmlElementPosition(view, nodeId)
                  : findOutlinePosition(view, nodeId);
        if (typeof i === 'undefined') return;
        const targetLine = i + (format === 'sections' ? 1 : 0);
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
