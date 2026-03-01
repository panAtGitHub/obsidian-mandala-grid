<script lang="ts">
    import type { MandalaCustomLayout } from 'src/stores/settings/settings-type';
    import {
        BUILTIN_MANDALA_LAYOUT_PATTERNS,
        BUILTIN_MANDALA_LAYOUT_IDS,
        gridToPattern,
        patternToGrid,
        patternToPreviewRows,
    } from 'src/view/helpers/mandala/mandala-grid-custom-layout';

    export let selectedLayoutId = BUILTIN_MANDALA_LAYOUT_IDS['left-to-right'];
    export let customLayouts: MandalaCustomLayout[] = [];
    export let onSelectLayout: (layoutId: string) => void;
    export let onAddCustomLayout: () => void;
    export let onUpdateCustomLayout: (
        id: string,
        name: string,
        pattern: string,
    ) => void;
    export let onDeleteCustomLayout: (id: string) => void;

    const getBuiltinLayoutName = (layoutId: string) =>
        layoutId === BUILTIN_MANDALA_LAYOUT_IDS['south-start']
            ? '从南开始'
            : '从左到右（Z形）';

    const validateGridDraft = (grid: string[][]) => {
        const values = grid.flat().filter((value, index) => index !== 4);
        if (values.some((value) => value === '')) return '请填完整 8 个位置';
        if (values.some((value) => !/^[1-8]$/.test(value))) {
            return '外圈只能填写 1 到 8';
        }
        if (new Set(values).size !== 8) return '外圈数字不能重复';
        return null;
    };

    const getPreviewRows = (layoutId: string) => {
        if (layoutId === BUILTIN_MANDALA_LAYOUT_IDS['south-start']) {
            return patternToPreviewRows(
                BUILTIN_MANDALA_LAYOUT_PATTERNS['south-start'],
            );
        }
        if (layoutId === BUILTIN_MANDALA_LAYOUT_IDS['left-to-right']) {
            return patternToPreviewRows(
                BUILTIN_MANDALA_LAYOUT_PATTERNS['left-to-right'],
            );
        }
        return patternToPreviewRows(selectedCustomLayout?.pattern ?? '123405678');
    };

    let editingLayoutId: string | null = null;
    let nameDraft = '';
    let nameError: string | null = null;
    let gridDraft = patternToGrid('123405678');
    let gridError: string | null = null;
    let selectedCustomLayout: MandalaCustomLayout | null = null;
    let previewRows: string[] = [];
    let selectedLayoutName = '从左到右（Z形）';

    $: selectedCustomLayout =
        customLayouts.find((layout) => layout.id === selectedLayoutId) ?? null;
    $: previewRows = getPreviewRows(selectedLayoutId);
    $: selectedLayoutName = selectedLayoutId.startsWith('custom:')
        ? selectedCustomLayout?.name ?? '自定义布局'
        : getBuiltinLayoutName(selectedLayoutId);

    $: if (selectedCustomLayout?.id !== editingLayoutId) {
        editingLayoutId = selectedCustomLayout?.id ?? null;
        nameDraft = selectedCustomLayout?.name ?? '';
        nameError = null;
        gridDraft = patternToGrid(selectedCustomLayout?.pattern ?? '123405678');
        gridError = null;
    }

    const commitName = () => {
        if (!selectedCustomLayout) return;
        const nextName = nameDraft.trim();
        if (!nextName) {
            nameError = '请输入名称';
            return;
        }
        nameError = null;
        if (nextName === selectedCustomLayout.name) return;
        onUpdateCustomLayout(
            selectedCustomLayout.id,
            nextName,
            selectedCustomLayout.pattern,
        );
    };

    const updateGridCell = (row: number, col: number, value: string) => {
        const nextGrid = gridDraft.map((currentRow) => [...currentRow]);
        nextGrid[row][col] = value;
        gridDraft = nextGrid;
        const error = validateGridDraft(nextGrid);
        gridError = error;
        if (error || !selectedCustomLayout) return;
        const nextPattern = gridToPattern(nextGrid);
        if (nextPattern === selectedCustomLayout.pattern) return;
        onUpdateCustomLayout(
            selectedCustomLayout.id,
            selectedCustomLayout.name,
            nextPattern,
        );
    };

    const onGridInput = (row: number, col: number, event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        const nextValue = target.value.replace(/[^1-8]/g, '').slice(-1);
        target.value = nextValue;
        updateGridCell(row, col, nextValue);
    };
</script>

<div class="view-options-menu__subsection">
    <div class="view-options-menu__subsection-title">九宫格方位布局</div>
    <div class="grid-layout-panel__list">
        <label class="view-options-menu__inline-option">
            <input
                type="radio"
                name="mandala-grid-layout"
                checked={selectedLayoutId === BUILTIN_MANDALA_LAYOUT_IDS['left-to-right']}
                on:change={() =>
                    onSelectLayout(BUILTIN_MANDALA_LAYOUT_IDS['left-to-right'])}
            />
            <span>从左到右（Z形）</span>
        </label>
        <label class="view-options-menu__inline-option">
            <input
                type="radio"
                name="mandala-grid-layout"
                checked={selectedLayoutId === BUILTIN_MANDALA_LAYOUT_IDS['south-start']}
                on:change={() =>
                    onSelectLayout(BUILTIN_MANDALA_LAYOUT_IDS['south-start'])}
            />
            <span>从南开始</span>
        </label>
    </div>

    <div class="grid-layout-panel__custom-group">
        <div class="view-options-menu__subsection-title">自定义布局</div>
        <div class="grid-layout-panel__custom-list">
            {#if customLayouts.length === 0}
                <div class="grid-layout-panel__empty">还没有自定义排序</div>
            {/if}
            {#each customLayouts as layout (layout.id)}
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-grid-layout"
                        checked={selectedLayoutId === layout.id}
                        on:change={() => onSelectLayout(layout.id)}
                    />
                    <span>{layout.name}</span>
                </label>
            {/each}
        </div>
        <button
            class="view-options-menu__subitem grid-layout-panel__add-button"
            type="button"
            on:click={onAddCustomLayout}
        >
            新增自定义排序
        </button>
    </div>

    <div class="grid-layout-panel__preview">
        <div class="grid-layout-panel__preview-title">{selectedLayoutName}</div>
        <div class="grid-layout-panel__preview-grid">
            {#each previewRows as row (row)}
                <div class="grid-layout-panel__preview-row">{row}</div>
            {/each}
        </div>
        <div class="grid-layout-panel__preview-help">0 为中心</div>
    </div>

    {#if selectedCustomLayout}
        <div class="grid-layout-panel__editor">
            <label class="view-options-menu__row">
                <span>布局名称</span>
                <div class="view-options-menu__row-controls">
                    <input
                        class="grid-layout-panel__name-input"
                        type="text"
                        maxlength="20"
                        bind:value={nameDraft}
                        on:blur={commitName}
                    />
                </div>
            </label>
            {#if nameError}
                <div class="grid-layout-panel__error">{nameError}</div>
            {/if}

            <div class="grid-layout-panel__editor-title">3x3 布局编辑器</div>
            <div class="grid-layout-panel__editor-grid">
                {#each gridDraft as row, rowIndex (`row-${rowIndex}`)}
                    {#each row as value, colIndex (`cell-${rowIndex}-${colIndex}`)}
                        {#if rowIndex === 1 && colIndex === 1}
                            <div class="grid-layout-panel__center-cell">0</div>
                        {:else}
                            <input
                                class="grid-layout-panel__cell-input"
                                type="text"
                                inputmode="numeric"
                                maxlength="1"
                                value={value}
                                on:input={(event) =>
                                    onGridInput(rowIndex, colIndex, event)}
                            />
                        {/if}
                    {/each}
                {/each}
            </div>
            {#if gridError}
                <div class="grid-layout-panel__error">{gridError}</div>
            {/if}

            <div class="grid-layout-panel__actions">
                <button
                    class="view-options-menu__subitem grid-layout-panel__delete-button"
                    type="button"
                    on:click={() => onDeleteCustomLayout(selectedCustomLayout.id)}
                >
                    删除当前自定义布局
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .grid-layout-panel__list,
    .grid-layout-panel__custom-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .grid-layout-panel__custom-group {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--background-modifier-border);
    }

    .grid-layout-panel__empty,
    .grid-layout-panel__preview-help {
        color: var(--text-muted);
        font-size: 12px;
    }

    .grid-layout-panel__add-button,
    .grid-layout-panel__delete-button {
        margin-top: 12px;
    }

    .grid-layout-panel__preview,
    .grid-layout-panel__editor {
        margin-top: 16px;
        padding: 12px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 12px;
        background: var(--background-primary-alt);
    }

    .grid-layout-panel__preview-title,
    .grid-layout-panel__editor-title {
        margin-bottom: 8px;
        font-weight: 600;
    }

    .grid-layout-panel__preview-grid {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-family: var(--font-monospace);
        font-size: 13px;
    }

    .grid-layout-panel__preview-row {
        white-space: pre;
    }

    .grid-layout-panel__name-input,
    .grid-layout-panel__cell-input,
    .grid-layout-panel__center-cell {
        width: 100%;
        min-width: 0;
        height: 40px;
        border-radius: 8px;
        border: 1px solid var(--background-modifier-border);
        text-align: center;
        font-size: 16px;
        background: var(--background-primary);
        color: var(--text-normal);
    }

    .grid-layout-panel__editor-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
    }

    .grid-layout-panel__center-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--background-secondary);
        font-weight: 600;
    }

    .grid-layout-panel__error {
        margin-top: 8px;
        color: var(--text-error);
        font-size: 12px;
    }

    .grid-layout-panel__actions {
        display: flex;
        justify-content: flex-end;
    }

    .grid-layout-panel__delete-button {
        color: var(--text-error);
    }
</style>
