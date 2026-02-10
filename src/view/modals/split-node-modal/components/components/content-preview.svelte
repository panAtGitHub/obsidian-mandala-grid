<script lang="ts">
    import { MarkdownRenderer } from 'obsidian';
    import { getModalState } from 'src/view/modals/split-node-modal/helpers/get-modal-state';
    import { getModalProps } from 'src/view/modals/split-node-modal/helpers/get-modal-props';

    const state = getModalState();
    const props = getModalProps();

    const mode = state.mode;
    const content = state.content;

    const renderMarkdownContent = (element: HTMLElement, markdown: string) => {
        const render = () => {
            element.empty();
            if (!markdown) {
                return;
            }
            void Promise.resolve(
                MarkdownRenderer.render(
                    props.plugin.app,
                    markdown,
                    element,
                    '',
                    props.plugin,
                ),
            );
        };
        render();
        return {
            update(nextMarkdown: string) {
                markdown = nextMarkdown;
                render();
            },
        };
    };
</script>

<div>
    {#if !$mode}
        <p class="mod-warning">
            This section does not match any splitting pattern
        </p>
    {/if}
</div>
<div class="preview">
    <div use:renderMarkdownContent={$content}></div>
</div>

<style>
    .preview {
        flex-grow: 1;
        max-height: 500px;
        overflow: auto;
    }
</style>
