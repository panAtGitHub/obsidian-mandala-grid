<script lang="ts">
    import { X } from 'lucide-svelte';
    import type { MandalaCustomLayout } from 'src/stores/settings/settings-type';
    import Portal from 'src/view/components/container/shared/portal.svelte';
    import {
        gridToPattern,
        patternToGrid,
    } from 'src/view/helpers/mandala/mandala-grid-custom-layout';

    export let open = false;
    export let isMobile = false;
    export let activeLayoutId = 'builtin:left-to-right';
    export let customLayouts: MandalaCustomLayout[] = [];
    export let onClose: () => void;
    export let onSelectLayout: (layoutId: string) => void;
    export let onCreateCustomLayout: (layout: MandalaCustomLayout) => void;
    export let onUpdateCustomLayout: (
        id: string,
        name: string,
        pattern: string,
    ) => void;
    export let onDeleteCustomLayout: (id: string) => void;

    type DraftMode = 'empty' | 'create' | 'edit';

    const createEmptyDraftGrid = () => [
        ['', '', ''],
        ['', '0', ''],
        ['', '', ''],
    ];

    const cloneGrid = (grid: string[][]) => grid.map((row) => [...row]);

    const normalizeLayoutName = (name: string) =>
        name.trim().toLocaleLowerCase();

    const validateDraftName = (
        name: string,
        currentId: string | null,
    ): string | null => {
        const normalizedName = name.trim();
        if (!normalizedName) return '请输入名称';
        const comparable = normalizeLayoutName(normalizedName);
        const duplicated = customLayouts.some(
            (layout) =>
                layout.id !== currentId &&
                normalizeLayoutName(layout.name) === comparable,
        );
        return duplicated ? '名称不能重复' : null;
    };

    const validateDraftGrid = (grid: string[][]): string | null => {
        const values = grid.flat().filter((_, index) => index !== 4);
        if (values.some((value) => value === '')) return '请填完整 8 个位置';
        if (values.some((value) => !/^[1-8]$/.test(value))) {
            return '外圈只能填写 1 到 8';
        }
        if (new Set(values).size !== 8) return '外圈数字不能重复';
        return null;
    };

    const resetErrors = () => {
        nameError = null;
        gridError = null;
    };

    const loadExistingLayout = (layout: MandalaCustomLayout) => {
        draftMode = 'edit';
        editingLayoutId = layout.id;
        draftName = layout.name;
        draftGrid = patternToGrid(layout.pattern);
        resetErrors();
    };

    const showEmptyState = () => {
        draftMode = 'empty';
        editingLayoutId = null;
        draftName = '';
        draftGrid = createEmptyDraftGrid();
        resetErrors();
    };

    const initializeDraft = () => {
        const activeCustomLayout =
            customLayouts.find((layout) => layout.id === activeLayoutId) ?? null;
        if (activeCustomLayout) {
            loadExistingLayout(activeCustomLayout);
            return;
        }
        showEmptyState();
    };

    let previousOpen = false;
    let draftMode: DraftMode = 'empty';
    let editingLayoutId: string | null = null;
    let draftName = '';
    let draftGrid = createEmptyDraftGrid();
    let nameError: string | null = null;
    let gridError: string | null = null;

    $: if (open && !previousOpen) {
        previousOpen = true;
        initializeDraft();
    } else if (!open && previousOpen) {
        previousOpen = false;
    }

    $: if (
        open &&
        draftMode === 'edit' &&
        editingLayoutId &&
        !customLayouts.some((layout) => layout.id === editingLayoutId)
    ) {
        initializeDraft();
    }

    $: previewRows = draftGrid.map((row) =>
        row.map((value) => value || '·').join(' '),
    );
    $: activeLayoutLabel =
        activeLayoutId === 'builtin:south-start'
            ? '从南开始'
            : activeLayoutId === 'builtin:left-to-right'
              ? '从左到右'
              : (() => {
                    const customLayout =
                        customLayouts.find(
                            (layout) => layout.id === activeLayoutId,
                        ) ?? null;
                    return customLayout
                        ? `自定义 / ${customLayout.name}`
                        : '从左到右';
                })();
    $: editorTitle =
        draftMode === 'create'
            ? '新建自定义布局'
            : draftMode === 'edit'
              ? '编辑自定义布局'
              : '自定义布局';
    $: canSaveDraft =
        draftMode !== 'empty' &&
        !validateDraftName(draftName, editingLayoutId) &&
        !validateDraftGrid(draftGrid);

    const startCreate = () => {
        draftMode = 'create';
        editingLayoutId = null;
        draftName = '';
        draftGrid = createEmptyDraftGrid();
        resetErrors();
    };

    const startEdit = (layoutId: string) => {
        const layout =
            customLayouts.find((item) => item.id === layoutId) ?? null;
        if (!layout) return;
        loadExistingLayout(layout);
    };

    const validateDraft = () => {
        nameError = validateDraftName(draftName, editingLayoutId);
        gridError = validateDraftGrid(draftGrid);
        return !nameError && !gridError;
    };

    const handleNameInput = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        draftName = target.value;
        if (nameError) {
            nameError = validateDraftName(draftName, editingLayoutId);
        }
    };

    const handleCellInput = (row: number, col: number, event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        const nextValue = target.value.replace(/[^1-8]/g, '').slice(-1);
        target.value = nextValue;
        const nextGrid = cloneGrid(draftGrid);
        nextGrid[row][col] = nextValue;
        draftGrid = nextGrid;
        if (gridError) {
            gridError = validateDraftGrid(nextGrid);
        }
    };

    const saveDraft = () => {
        if (!validateDraft()) return;
        const normalizedName = draftName.trim();
        const pattern = gridToPattern(draftGrid);

        if (draftMode === 'create') {
            const layout: MandalaCustomLayout = {
                id: `custom:${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,
                name: normalizedName,
                pattern,
            };
            onCreateCustomLayout(layout);
            onSelectLayout(layout.id);
            loadExistingLayout(layout);
            return;
        }

        if (!editingLayoutId) return;
        onUpdateCustomLayout(editingLayoutId, normalizedName, pattern);
        onSelectLayout(editingLayoutId);
        loadExistingLayout({
            id: editingLayoutId,
            name: normalizedName,
            pattern,
        });
    };

    const deleteCurrentLayout = () => {
        if (draftMode !== 'edit' || !editingLayoutId) return;
        const currentIndex = customLayouts.findIndex(
            (layout) => layout.id === editingLayoutId,
        );
        const remainingLayouts = customLayouts.filter(
            (layout) => layout.id !== editingLayoutId,
        );
        const nextLayout =
            remainingLayouts[currentIndex] ??
            remainingLayouts[currentIndex - 1] ??
            null;
        const targetId = editingLayoutId;
        onDeleteCustomLayout(targetId);
        if (nextLayout) {
            loadExistingLayout(nextLayout);
            return;
        }
        showEmptyState();
    };

    const cancelDraft = () => {
        if (draftMode !== 'create') return;
        initializeDraft();
    };
</script>

{#if open}
    <Portal>
        <div
            class="custom-layout-modal__overlay"
            on:click={onClose}
            on:mousedown|stopPropagation
            on:touchstart|stopPropagation
        />
        <div
            class="mandala-modal custom-layout-modal"
            class:is-mobile={isMobile}
            on:mousedown|stopPropagation
            on:touchstart|stopPropagation
        >
            {#if isMobile}
                <div class="mobile-modal-header">
                    <div class="mobile-modal-title">自定义布局</div>
                    <button
                        class="mobile-done-button"
                        type="button"
                        on:click={onClose}
                    >
                        <X size={18} />
                        <span>关闭</span>
                    </button>
                </div>
            {:else}
                <div class="view-options-menu__header">
                    <span class="view-options-menu__title">自定义布局</span>
                    <button
                        class="view-options-menu__close"
                        type="button"
                        on:click={onClose}
                        aria-label="关闭自定义布局"
                    >
                        <X class="icon" size={16} />
                    </button>
                </div>
            {/if}

            <div class="custom-layout-modal__body">
                <div class="custom-layout-modal__sidebar">
                    <div class="custom-layout-modal__sidebar-header">
                        <div class="view-options-menu__subsection-title">
                            已保存布局
                        </div>
                        <button
                            class="view-options-menu__subitem custom-layout-modal__create-button"
                            type="button"
                            on:click={startCreate}
                        >
                            新增自定义布局
                        </button>
                    </div>

                    <div class="custom-layout-modal__active-note">
                        当前生效：{activeLayoutLabel}
                    </div>

                    {#if customLayouts.length === 0}
                        <div class="custom-layout-modal__empty">
                            还没有自定义布局，点击上方按钮开始新建。
                        </div>
                    {:else}
                        <div class="custom-layout-modal__list">
                            {#each customLayouts as layout (layout.id)}
                                <button
                                    class="custom-layout-modal__list-item"
                                    class:is-editing={editingLayoutId === layout.id &&
                                        draftMode === 'edit'}
                                    type="button"
                                    on:click={() => startEdit(layout.id)}
                                >
                                    <span>{layout.name}</span>
                                    {#if activeLayoutId === layout.id}
                                        <span class="custom-layout-modal__badge">
                                            当前使用
                                        </span>
                                    {/if}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <div class="custom-layout-modal__editor">
                    <div class="custom-layout-modal__editor-header">
                        <div class="custom-layout-modal__editor-title">
                            {editorTitle}
                        </div>
                        {#if draftMode === 'create'}
                            <div class="view-options-menu__note">
                                请先填写名称和周边 8 格
                            </div>
                        {/if}
                    </div>

                    {#if draftMode === 'empty'}
                        <div class="custom-layout-modal__empty-editor">
                            选择一个已有布局，或新增一个自定义布局。
                        </div>
                    {:else}
                        <label class="view-options-menu__row">
                            <span>布局名称</span>
                            <div class="view-options-menu__row-controls">
                                <input
                                    class="custom-layout-modal__name-input"
                                    type="text"
                                    maxlength="20"
                                    placeholder="请输入唯一名称"
                                    value={draftName}
                                    on:input={handleNameInput}
                                />
                            </div>
                        </label>
                        {#if nameError}
                            <div class="custom-layout-modal__error">
                                {nameError}
                            </div>
                        {/if}

                        <div class="custom-layout-modal__grid-section">
                            <div class="view-options-menu__subsection-title">
                                周边 8 格
                            </div>
                            <div class="custom-layout-modal__grid">
                                {#each draftGrid as row, rowIndex (`row-${rowIndex}`)}
                                    {#each row as value, colIndex (`cell-${rowIndex}-${colIndex}`)}
                                        {#if rowIndex === 1 && colIndex === 1}
                                            <div class="custom-layout-modal__center-cell">
                                                0
                                            </div>
                                        {:else}
                                            <input
                                                class="custom-layout-modal__grid-input"
                                                type="text"
                                                inputmode="numeric"
                                                maxlength="1"
                                                placeholder=" "
                                                value={value}
                                                on:input={(event) =>
                                                    handleCellInput(
                                                        rowIndex,
                                                        colIndex,
                                                        event,
                                                    )}
                                            />
                                        {/if}
                                    {/each}
                                {/each}
                            </div>
                            {#if gridError}
                                <div class="custom-layout-modal__error">
                                    {gridError}
                                </div>
                            {/if}
                        </div>

                        <div class="custom-layout-modal__preview">
                            <div class="view-options-menu__subsection-title">
                                当前预览
                            </div>
                            <div class="custom-layout-modal__preview-grid">
                                {#each previewRows as row (row)}
                                    <div class="custom-layout-modal__preview-row">
                                        {row}
                                    </div>
                                {/each}
                            </div>
                        </div>

                        <div class="custom-layout-modal__actions">
                            {#if draftMode === 'create'}
                                <button
                                    class="view-options-menu__subitem"
                                    type="button"
                                    on:click={cancelDraft}
                                >
                                    取消新增
                                </button>
                            {/if}
                            {#if draftMode === 'edit'}
                                <button
                                    class="view-options-menu__subitem custom-layout-modal__delete-button"
                                    type="button"
                                    on:click={deleteCurrentLayout}
                                >
                                    删除当前布局
                                </button>
                            {/if}
                            <button
                                class="view-options-menu__subitem custom-layout-modal__save-button"
                                type="button"
                                disabled={!canSaveDraft}
                                on:click={saveDraft}
                            >
                                保存并应用
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </Portal>
{/if}

<style>
    .custom-layout-modal__overlay {
        position: fixed;
        inset: 0;
        z-index: 1300;
        background: rgba(0, 0, 0, 0.22);
    }

    .custom-layout-modal {
        position: fixed;
        z-index: 1301;
        top: 72px;
        right: 16px;
        width: min(760px, calc(100vw - 32px));
        max-height: calc(100vh - 96px);
        padding: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .custom-layout-modal.is-mobile {
        inset: auto 12px 12px 12px;
        width: auto;
        max-height: calc(100vh - 24px);
    }

    .custom-layout-modal__body {
        display: grid;
        grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
        gap: 0;
        min-height: 0;
        overflow: hidden;
    }

    .custom-layout-modal.is-mobile .custom-layout-modal__body {
        grid-template-columns: 1fr;
    }

    .custom-layout-modal__sidebar,
    .custom-layout-modal__editor {
        min-height: 0;
        overflow: auto;
        padding: 14px;
    }

    .custom-layout-modal__sidebar {
        border-right: 1px solid var(--background-modifier-border);
        background: color-mix(
            in srgb,
            var(--background-secondary) 78%,
            var(--background-primary)
        );
    }

    .custom-layout-modal.is-mobile .custom-layout-modal__sidebar {
        border-right: none;
        border-bottom: 1px solid var(--background-modifier-border);
    }

    .custom-layout-modal__sidebar-header {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .custom-layout-modal__create-button {
        width: 100%;
        text-align: center;
    }

    .custom-layout-modal__active-note,
    .custom-layout-modal__empty,
    .custom-layout-modal__empty-editor {
        margin-top: 10px;
        color: var(--text-muted);
        font-size: 12px;
        line-height: 1.4;
    }

    .custom-layout-modal__list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
    }

    .custom-layout-modal__list-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        border: 1px solid var(--background-modifier-border);
        border-radius: 10px;
        padding: 10px 12px;
        background: var(--background-primary);
        color: var(--text-normal);
        text-align: left;
        font-size: 12px;
        cursor: pointer;
    }

    .custom-layout-modal__list-item.is-editing {
        border-color: var(--interactive-accent);
        background: color-mix(
            in srgb,
            var(--interactive-accent) 10%,
            var(--background-primary)
        );
    }

    .custom-layout-modal__badge {
        color: var(--interactive-accent);
        font-size: 11px;
        white-space: nowrap;
    }

    .custom-layout-modal__editor {
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: var(--background-primary);
    }

    .custom-layout-modal__editor-header {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .custom-layout-modal__editor-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-normal);
    }

    .custom-layout-modal__name-input,
    .custom-layout-modal__grid-input,
    .custom-layout-modal__center-cell {
        width: 100%;
        min-width: 0;
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        background: var(--background-primary);
        color: var(--text-normal);
    }

    .custom-layout-modal__name-input {
        padding: 6px 10px;
    }

    .custom-layout-modal__grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-top: 8px;
    }

    .custom-layout-modal__grid-input,
    .custom-layout-modal__center-cell {
        height: 44px;
        text-align: center;
        font-size: 16px;
    }

    .custom-layout-modal__center-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--background-secondary);
        font-weight: 600;
    }

    .custom-layout-modal__preview {
        padding: 12px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 10px;
        background: var(--background-secondary);
    }

    .custom-layout-modal__preview-grid {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 8px;
        font-family: var(--font-monospace);
        font-size: 13px;
    }

    .custom-layout-modal__preview-row {
        white-space: pre;
    }

    .custom-layout-modal__error {
        color: var(--text-error);
        font-size: 12px;
        line-height: 1.4;
    }

    .custom-layout-modal__actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
        margin-top: auto;
    }

    .custom-layout-modal__delete-button {
        color: var(--text-error);
    }

    .custom-layout-modal__save-button {
        min-width: 120px;
        text-align: center;
    }

    .custom-layout-modal__save-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
</style>
