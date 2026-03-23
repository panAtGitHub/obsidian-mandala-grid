<script lang="ts">
    import { Platform } from 'obsidian';
    import { getCellRuntime } from 'src/view/context';
    import { createEventDispatcher, onDestroy, onMount } from 'svelte';
    import { createMobileDoubleTapDetector } from 'src/mandala-interaction/helpers/mobile-double-tap';
    import type { InlineMarkdownView } from 'src/obsidian/helpers/inline-editor/inline-editor';

    export let nodeId: string;

    const cellRuntime = getCellRuntime();
    const dispatch = createEventDispatcher<{
        mobilePreviewDoubleTapEdit: { nodeId: string };
    }>();
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
    let content = '';
    let hostEl: HTMLDivElement | null = null;
    let markdownView: InlineMarkdownView | null = null;
    let unsubscribeReadonlyGuards: () => void = () => {};
    let unsubscribe: () => void = () => {};
    let currentNodeId = '';
    const doubleTapDetector = createMobileDoubleTapDetector();

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

    const blockMobilePreviewInteraction = (event: Event) => {
        if (!Platform.isMobile) return;
        event.preventDefault();
        event.stopPropagation();
    };

    const isInteractiveTarget = (target: HTMLElement | null) =>
        Boolean(
            target?.closest('a, button, input, textarea, select, [role="button"]'),
        );

    const handleMobilePreviewTouchEnd = (event: TouchEvent) => {
        if (!Platform.isMobile) return;
        const target = event.target as HTMLElement | null;
        if (isInteractiveTarget(target)) {
            doubleTapDetector.reset();
            return;
        }
        const touch = event.changedTouches.item(0);
        if (!touch || !nodeId) {
            doubleTapDetector.reset();
            return;
        }

        const isDoubleTap = doubleTapDetector.registerTap({
            key: nodeId,
            x: touch.clientX,
            y: touch.clientY,
        });
        if (!isDoubleTap) return;

        event.preventDefault();
        event.stopPropagation();
        dispatch('mobilePreviewDoubleTapEdit', { nodeId });
    };

    const blurMobileFocus = (event: FocusEvent) => {
        if (!Platform.isMobile) return;
        const target = event.target;
        if (target instanceof HTMLElement) {
            target.blur();
        }
        const activeEl = document.activeElement;
        if (activeEl instanceof HTMLElement) {
            activeEl.blur();
        }
    };

    const subscribeToNode = (nextNodeId: string) => {
        if (currentNodeId === nextNodeId) return;
        unsubscribe();
        currentNodeId = nextNodeId;
        const store = cellRuntime.contentForNode(nextNodeId);
        unsubscribe = store.subscribe((value) => {
            updateContent(value);
        });
    };

    $: if (nodeId) {
        subscribeToNode(nodeId);
    }

    onMount(async () => {
        if (!hostEl) return;

        markdownView =
            await cellRuntime.createReadonlySourcePreviewView(hostEl);
        if (!markdownView) return;
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
    on:mousedown|capture={blockMobilePreviewInteraction}
    on:click|capture={blockMobilePreviewInteraction}
    on:dblclick|capture={blockMobilePreviewInteraction}
    on:touchend|capture={handleMobilePreviewTouchEnd}
    on:focusin|capture={blurMobileFocus}
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
