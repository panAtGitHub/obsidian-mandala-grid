<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import InlineEditor from 'src/cell/display/content/inline-editor.svelte';

    export let nodeId: string;
    export let fontSize: number;
    export let editorBodyEl: HTMLDivElement | null = null;

    let showSettings = false;

    const dispatch = createEventDispatcher<{
        save: void;
        focusin: FocusEvent;
        focusout: FocusEvent;
        increasefontsize: void;
        decreasefontsize: void;
    }>();

    const toggleSettings = () => {
        showSettings = !showSettings;
    };

    const onSave = () => {
        dispatch('save');
    };

    const onFocusIn = (event: FocusEvent) => {
        dispatch('focusin', event);
    };

    const onFocusOut = (event: FocusEvent) => {
        dispatch('focusout', event);
    };

    const onIncreaseFontSize = () => {
        dispatch('increasefontsize');
    };

    const onDecreaseFontSize = () => {
        dispatch('decreasefontsize');
    };
</script>

<div class="mobile-native-editor-sheet">
    <div class="mobile-edit-header">
        <button
            class="header-btn settings-btn"
            on:click|stopPropagation={toggleSettings}
            aria-label="设置"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-settings"
            >
                <path
                    d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                />
                <circle cx="12" cy="12" r="3" />
            </svg>
        </button>
        <div class="mobile-edit-title">编辑格子</div>
        <button class="header-btn save-btn" on:click|stopPropagation={onSave}
            >保存</button
        >
    </div>

    <div class="mobile-popup-editor-container">
        {#if showSettings}
            <div class="mobile-settings-panel" on:click|stopPropagation>
                <div class="settings-row">
                    <span class="settings-label">字号</span>
                    <div class="font-size-controls">
                        <button
                            class="control-btn"
                            on:click|stopPropagation={onDecreaseFontSize}
                            >-</button
                        >
                        <span class="font-value">{fontSize}px</span>
                        <button
                            class="control-btn"
                            on:click|stopPropagation={onIncreaseFontSize}
                            >+</button
                        >
                    </div>
                </div>
            </div>
        {/if}
        <div
            bind:this={editorBodyEl}
            class="mobile-popup-editor-body"
            on:focusin={onFocusIn}
            on:focusout={onFocusOut}
        >
            <InlineEditor
                {nodeId}
                absoluteFontSize={fontSize}
                disableAutoResize={true}
            />
        </div>
    </div>
</div>

<style>
    .mobile-native-editor-sheet {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background-color: var(--background-primary);
        isolation: isolate;
    }

    .mobile-popup-editor-container {
        position: fixed;
        top: var(--vvo, 0px);
        left: 0;
        width: 100vw;
        height: var(--vvh, 100dvh);
        background-color: var(--background-primary);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        overscroll-behavior: contain;
        padding-top: calc(env(safe-area-inset-top, 20px) + 50px);
    }

    .mobile-popup-editor-body {
        padding: 16px;
        flex: 1;
        min-height: 0;
        overflow: auto;
        -webkit-overflow-scrolling: touch;
        touch-action: auto;
        overscroll-behavior-x: contain;
        padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
        background-color: var(--background-primary);
        -webkit-user-select: text;
        user-select: text;
    }

    .mobile-popup-editor-body :global(.editor-container) {
        height: 100%;
        min-height: 0;
        overflow: hidden;
    }

    .mobile-popup-editor-body :global(.mandala-inline-editor) {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }

    .mobile-popup-editor-body :global(.cm-editor) {
        height: 100%;
        min-height: 0;
    }

    .mobile-popup-editor-body :global(.cm-editor .cm-scroller) {
        min-height: 0;
        overflow: auto;
        -webkit-overflow-scrolling: touch;
        touch-action: auto;
        overscroll-behavior: contain;
        overscroll-behavior-x: contain;
        padding-bottom: calc(
            max(var(--vvb, 0px), var(--vkf, 0px)) +
                env(safe-area-inset-bottom, 0px) +
                20px
        ) !important;
        scroll-padding-bottom: calc(
            max(var(--vvb, 0px), var(--vkf, 0px)) +
                env(safe-area-inset-bottom, 0px) +
                80px
        );
    }

    .mobile-edit-header {
        position: fixed;
        top: var(--vvo, 0px);
        left: 0;
        width: 100%;
        height: calc(env(safe-area-inset-top, 20px) + 50px);
        background-color: var(--background-primary-alt);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--background-modifier-border);
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: 0 16px 12px 16px;
        z-index: 1001;
        pointer-events: auto;
    }

    .mobile-edit-title {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        font-weight: 600;
        font-size: 20px;
        color: var(--text-normal);
    }

    .header-btn {
        background: none;
        border: none;
        font-size: 16px;
        color: var(--text-accent);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: background-color 0.2s;
    }

    .header-btn:hover {
        background-color: var(--background-modifier-hover);
    }

    .settings-btn {
        color: var(--text-muted);
    }

    .save-btn {
        font-weight: 500;
    }

    .mobile-settings-panel {
        position: absolute;
        top: calc(env(safe-area-inset-top, 20px) + 60px);
        left: 16px;
        right: 16px;
        background-color: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        padding: 16px;
        z-index: 1002;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .settings-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .settings-label {
        font-size: 14px;
        color: var(--text-normal);
    }

    .font-size-controls {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .control-btn {
        width: 28px;
        height: 28px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
    }

    .font-value {
        min-width: 50px;
        text-align: center;
        font-size: 14px;
        color: var(--text-normal);
    }

    .mobile-popup-editor-body :global(.mandala-section-label) {
        display: none;
    }
</style>
