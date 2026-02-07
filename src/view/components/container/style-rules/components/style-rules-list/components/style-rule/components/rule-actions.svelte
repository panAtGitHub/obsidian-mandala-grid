<script lang="ts">
    import { StyleRule } from '../../../../../../../../../stores/settings/types/style-rules-types';
    import { getView } from '../../../../../../context';
    import { MoreVertical } from 'lucide-svelte';
    import { Menu, MenuItem } from 'obsidian';
    import { get } from 'svelte/store';
    import { ActiveStyleRulesTab } from 'src/stores/settings/derived/style-rules';
    import { lang } from 'src/lang/lang';

    export let rule: StyleRule;

    const view = getView();

    const toggleRule = (e: Event) => {
        const target = e.target as HTMLInputElement;
        view.plugin.settings.dispatch({
            type: target.checked
                ? 'settings/style-rules/enable-rule'
                : 'settings/style-rules/disable-rule',
            payload: { documentPath: view.file!.path, id: rule.id },
        });
    };

    const deleteRule = () => {
        view.plugin.settings.dispatch({
            type: 'settings/style-rules/delete',
            payload: { documentPath: view.file!.path, id: rule.id },
        });
    };

    const moveRule = () => {
        const activeTab = get(ActiveStyleRulesTab(view));
        const activeTabIsGlobal = activeTab === 'global-rules';
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
                tab: activeTabIsGlobal ? 'document-rules' : 'global-rules',
            },
        });
    };

    const duplicateRule = () => {
        view.plugin.settings.dispatch({
            type: 'settings/style-rules/duplicate-rule',
            payload: {
                id: rule.id,
                documentPath: view.file!.path,
            },
        });
    };

    const showContextMenu = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.localName === 'input') return;
        const menu = new Menu();
        const activeTab = get(ActiveStyleRulesTab(view));
        const activeTabIsGlobal = activeTab === 'global-rules';
        menu.addItem((item) => {
            item.setTitle(
                activeTabIsGlobal
                    ? lang.modals_rules_rule_cm_move_to_document
                    : lang.modals_rules_rule_cm_move_to_global,
            );
            item.setIcon(activeTabIsGlobal ? 'file-text' : 'globe');

            item.onClick(moveRule);
        });
        menu.addItem((item) => {
            item.setTitle('Duplicate');
            item.setIcon('copy');
            item.onClick(duplicateRule);
        });
        menu.addItem((item) => {
            item.setTitle('Delete');
            item.setIcon('trash');
            item.onClick(deleteRule);
            const itemDom = (item as MenuItem & { dom?: HTMLElement }).dom;
            itemDom?.addClass('is-warning');
        });
        menu.showAtMouseEvent(e);
    };
</script>

<div class="rule-actions">
    <input
        type="checkbox"
        checked={rule.enabled}
        on:change={toggleRule}
        aria-label="Enable"
    />
    <div class="clickable-icon" on:click={showContextMenu} aria-label="Actions">
        <MoreVertical class="svg-icon" />
    </div>
</div>

<style>
    .rule-actions {
        display: flex;
        align-items: center;
        padding-top: 4px;
        padding-bottom: 4px;
        padding-left: 8px;
        border-left: 1px solid var(--text-faint);

        /*background-color: var(--color-base-30);*/
        justify-content: center;
    }

</style>
