<script lang="ts">
    import { tx } from 'src/lang/translate';
    import type { MandalaCustomLayout } from 'src/mandala-settings/state/settings-type';

    export let selectedLayoutId = 'builtin:left-to-right';
    export let customLayouts: MandalaCustomLayout[] = [];
    export let onSelectLayout: (layoutId: string) => void;
    export let onOpenCustomLayoutModal: () => void;

    $: isCustomSelected = selectedLayoutId.startsWith('custom:');
    $: activeCustomLayout =
        customLayouts.find((layout) => layout.id === selectedLayoutId) ?? null;
    $: activeSummary = isCustomSelected
        ? activeCustomLayout
            ? tx('当前：自定义 / {0}', activeCustomLayout.name)
            : tx('当前：自定义布局')
        : selectedLayoutId === 'builtin:south-start'
          ? tx('当前：从南开始')
          : tx('当前：从左到右');
</script>

<div class="view-options-menu__subsection">
    <div class="view-options-menu__subsection-title">
        {tx('九宫格方位布局')}
    </div>
    <div
        class="view-options-menu__row view-options-menu__row--inline grid-layout-panel__row"
    >
        <label class="view-options-menu__inline-option">
            <input
                type="radio"
                name="mandala-grid-layout"
                checked={selectedLayoutId === 'builtin:left-to-right'}
                on:change={() => onSelectLayout('builtin:left-to-right')}
            />
            <span>{tx('从左到右')}</span>
        </label>
        <label class="view-options-menu__inline-option">
            <input
                type="radio"
                name="mandala-grid-layout"
                checked={selectedLayoutId === 'builtin:south-start'}
                on:change={() => onSelectLayout('builtin:south-start')}
            />
            <span>{tx('从南开始')}</span>
        </label>
        <label
            class="view-options-menu__inline-option grid-layout-panel__custom-option"
            on:click|preventDefault={onOpenCustomLayoutModal}
        >
            <input
                type="radio"
                name="mandala-grid-layout"
                checked={isCustomSelected}
                on:click|preventDefault={onOpenCustomLayoutModal}
            />
            <span class="grid-layout-panel__custom-text"
                >{tx('自定义布局')}</span
            >
        </label>
    </div>
    <div class="view-options-menu__note grid-layout-panel__note">
        {activeSummary}
    </div>
</div>

<style>
    .grid-layout-panel__row {
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 18px;
        padding-bottom: 2px;
    }

    .grid-layout-panel__row :global(label),
    .grid-layout-panel__custom-text {
        white-space: nowrap;
    }

    .grid-layout-panel__custom-option {
        gap: 6px;
    }

    .grid-layout-panel__note {
        margin-top: 4px;
    }
</style>
