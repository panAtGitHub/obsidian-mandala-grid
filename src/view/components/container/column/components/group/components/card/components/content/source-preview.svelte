<script lang="ts">
    import { MarkdownView } from 'obsidian';
    import { getView } from 'src/view/components/container/context';
    import { onDestroy, onMount } from 'svelte';
    import { contentStore } from 'src/stores/document/derived/content-store';
    import type { InlineMarkdownView } from 'src/obsidian/helpers/inline-editor/inline-editor';

    export let nodeId: string;

    const view = getView();
    const EDITABLE_NAV_KEYS = new Set([
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'PageUp',
        'PageDown',
        'Home',
        'End',
        'Escape',
    ]);
    const ALLOWED_MODIFIER_KEYS = new Set(['a', 'c', 'f']);
    const noopSetViewData = function (
        this: void,
        _data: string,
        _clear: boolean,
    ): void {};

    let content = '';
    let hostEl: HTMLDivElement | null = null;
    let markdownView: InlineMarkdownView | null = null;
    let unsubscribeReadonlyGuards: () => void = () => {};
    let unsubscribe: () => void = () => {};
    let currentNodeId = '';

    const shouldBlockKeydown = (event: KeyboardEvent): boolean => {
        if (event.metaKey || event.ctrlKey) {
            return !ALLOWED_MODIFIER_KEYS.has(event.key.toLowerCase());
        }
        if (event.altKey) return false;
        if (EDITABLE_NAV_KEYS.has(event.key)) return false;
        if (event.key.length === 1) return true;
        return (
            event.key === 'Backspace' ||
            event.key === 'Delete' ||
            event.key === 'Enter' ||
            event.key === 'Tab'
        );
    };

    const applyReadonlyAttributes = () => {
        if (!hostEl) return;
        const cmContent = hostEl.querySelector('.cm-content');
        if (cmContent instanceof HTMLElement) {
            cmContent.setAttribute('contenteditable', 'false');
            cmContent.setAttribute('aria-readonly', 'true');
        }
    };

    const bindReadonlyGuards = () => {
        if (!hostEl) return () => {};
        const blockMutation = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
        };
        const onKeydown = (event: KeyboardEvent) => {
            if (!shouldBlockKeydown(event)) return;
            event.preventDefault();
            event.stopPropagation();
        };

        hostEl.addEventListener('beforeinput', blockMutation);
        hostEl.addEventListener('paste', blockMutation);
        hostEl.addEventListener('cut', blockMutation);
        hostEl.addEventListener('drop', blockMutation);
        hostEl.addEventListener('keydown', onKeydown, true);

        return () => {
            hostEl?.removeEventListener('beforeinput', blockMutation);
            hostEl?.removeEventListener('paste', blockMutation);
            hostEl?.removeEventListener('cut', blockMutation);
            hostEl?.removeEventListener('drop', blockMutation);
            hostEl?.removeEventListener('keydown', onKeydown, true);
        };
    };

    const updateContent = (value: string) => {
        content = value;
        if (!markdownView) return;
        markdownView.mandalaSetViewData(value, true);
        applyReadonlyAttributes();
    };

    const subscribeToNode = (nextNodeId: string) => {
        if (currentNodeId === nextNodeId) return;
        unsubscribe();
        currentNodeId = nextNodeId;
        const store = contentStore(view, nextNodeId);
        unsubscribe = store.subscribe((value) => {
            updateContent(value);
        });
    };

    $: if (nodeId) {
        subscribeToNode(nodeId);
    }

    onMount(async () => {
        if (!hostEl || !view.file) return;

        const workspace = view.plugin.app.workspace;
        markdownView = new MarkdownView({
            containerEl: hostEl,
            app: view.plugin.app,
            workspace,
            history: {
                backHistory: [],
                forwardHistory: [],
            },
        } as never) as InlineMarkdownView;

        const boundSetViewData = markdownView.setViewData.bind(markdownView);
        markdownView.mandalaSetViewData = boundSetViewData;
        markdownView.setViewData = noopSetViewData;

        if (markdownView.getMode() === 'preview') {
            await markdownView.setState({ mode: 'source' }, { history: false });
        }

        markdownView.file = view.file;
        await markdownView.onLoadFile(view.file);
        unsubscribeReadonlyGuards = bindReadonlyGuards();
        updateContent(content);
    });

    onDestroy(() => {
        unsubscribe();
        unsubscribeReadonlyGuards();

        const currentView = markdownView;
        if (!currentView) return;
        const file = currentView.file;
        currentView.file = null;
        if (file) {
            void currentView.onUnloadFile(file);
        }
        markdownView = null;
    });
</script>

<div
    bind:this={hostEl}
    class="source-preview-editor mandala-inline-editor mandala-inline-editor-readonly"
    role="textbox"
    aria-readonly="true"
/>

<style>
    .source-preview-editor {
        width: 100%;
        min-height: var(--min-node-height);
        height: 100%;
        overflow: hidden;
        display: flex;
    }

    :global(.mandala-inline-editor-readonly .cm-cursor),
    :global(.mandala-inline-editor-readonly .cm-dropCursor) {
        display: none !important;
    }
</style>
