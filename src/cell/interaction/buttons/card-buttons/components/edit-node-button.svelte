<script lang="ts">
    import { PencilIcon, SaveIcon } from 'lucide-svelte';
    import { Platform } from 'obsidian';
    import { lang } from 'src/lang/lang';
    import { getView } from 'src/views/shared/shell/context';
    import FloatingButton from '../../shared/floating-button.svelte';
    import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
    import { openNodeEditor } from 'src/view/helpers/mandala/open-node-editor';

    export let editing: boolean;
    export let nodeId: string;
    export let isInSidebar: boolean;
    const view = getView();

    const enableEditMode = (e: MouseEvent) => {
        e.stopPropagation();
        if (Platform.isMobile) {
            openNodeEditor(view, nodeId, {
                desktopIsInSidebar: false,
            });
            return;
        }
        openNodeEditor(view, nodeId, {
            desktopIsInSidebar: isInSidebar,
        });
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
