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
    import { Menu } from 'obsidian';
    import { get } from 'svelte/store';
    import { ActiveStyleRulesTab } from 'src/stores/settings/derived/style-rules';

    export let setDraggedRule: (rule: StyleRule) => void;
    export let setDropTarget: (
        rule: StyleRule,
        position: 'before' | 'after',
    ) => void;
    export let resetDragState: () => void;
    export let rule: StyleRule;
    export let results: string[] | undefined;

    const view = getView();

    const showContextMenu = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.localName === 'input') return;
        const menu = new Menu();
        const activeTab = get(ActiveStyleRulesTab(view));
        menu.addItem((item) => {
            const activeTabIsGlobal = activeTab === 'global-rules';
            item.setTitle(
                activeTabIsGlobal
                    ? lang.modals_rules_rule_cm_move_to_document
                    : lang.modals_rules_rule_cm_move_to_global,
            );
            item.setIcon(activeTabIsGlobal ? 'file-text' : 'globe');
            item.onClick(() => {
                view.plugin.settings.dispatch({
                    type: 'settings/style-rules/toggle-global',
                    payload: {
                        id: rule.id,
                        documentPath: view.file!.path,
                    },
                });
                view.plugin.settings.dispatch({
                    type: 'settings/style-rules/set-active-tab',
                    payload: {
                        tab: activeTabIsGlobal
                            ? 'document-rules'
                            : 'global-rules',
                    },
                });
            });
        });
        menu.showAtMouseEvent(e);
    };
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
    on:contextmenu={showContextMenu}
>
    <div class="drag-handle" aria-label={lang.modals_rules_drag_handle}>
        <GripVertical class="svg-icon" />
    </div>
    <RuleInfo {rule} {results} />
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
