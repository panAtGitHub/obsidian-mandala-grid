<script lang="ts">
    import RuleInfo from './components/rule-info.svelte';
    import RuleEditor from './components/rule-editor.svelte';
    import RuleStyleEditor from './components/rule-style-editor.svelte';
    import { GripVertical } from 'lucide-svelte';
    import { StyleRule } from '../../../../../../../../stores/settings/types/style-rules-types';
    import {
        ruleDndAction
    } from 'src/view/components/container/style-rules/components/style-rules-list/components/style-rule/components/actions/rule-dnd';
    import { getView } from '../../../../../context';
    import RuleActions from './components/rule-actions.svelte';
    import { lang } from 'src/lang/lang';

    export let setDraggedRule: (rule: StyleRule) => void;
    export let setDropTarget: (
        rule: StyleRule,
        position: 'before' | 'after',
    ) => void;
    export let resetDragState: () => void;
    export let rule: StyleRule;
    export let results: string[] | undefined;

    const view = getView();


</script>

<div
    class="rule-container"
    use:ruleDndAction={{
        setDraggedRule,
        setDropTarget,
        resetDragState,
        rule,
        view,
    }}
    draggable="true"
>
    <div class="drag-handle" aria-label={lang.modals_rules_drag_handle}>
        <GripVertical class="svg-icon" />
    </div>
    <RuleInfo {results} />
    <RuleEditor {rule} />
    <RuleStyleEditor {rule} />
    <RuleActions {rule} />
</div>

<style>
    .rule-container {
        margin-top: 10px;
        display: flex;
        border-radius: 4px;
        overflow: hidden;
        background-color: var(--color-base-20);
        padding: 12px;
        gap: 8px;
        flex-wrap: wrap;
    }

    .drag-handle {
        cursor: grab;
        color: var(--text-muted);
        padding: 4px;
        display: flex;
        align-items: center;
    }

    .drag-handle:hover {
        color: var(--text-normal);
    }
    .rule-container:nth-child(-n + 1) {
        margin-top: 0;
    }
</style>
