<script lang="ts">
    import { StyleRule } from '../../../../../../../../../stores/settings/types/style-rules-types';
    import { getView } from '../../../../../../context';
    import { ruleStyleEditorEventHandlers } from '../../../../../helpers/rule-style-editor-event-handlers';
    import { styleVariants } from 'src/view/components/container/style-rules/helpers/constants';
    import { styleRulesLang } from 'src/lang/style-rules-lang';

    export let rule: StyleRule;
    const view = getView();

    const h = ruleStyleEditorEventHandlers(view, rule.id);
</script>
<div class="rule-style-config">
        <input
            type="color"
            value={rule.style.color}
            on:input={h.handleColorChange}
        />

        <div class="select-elements">
            <select
                value={rule.style.styleVariant}
                on:change={h.handleStyleVariantChange}
            >
                {#each styleVariants as styleType (styleType)}
                    <option value={styleType}
                        >{styleRulesLang.styleVariants[styleType]}</option
                    >
                {/each}
            </select>
        </div>
    </div>

<style>
    .rule-style-config {
        width: fit-content;
        padding: 4px;
        padding-right: 0px;
        border-left: 1px solid var(--text-faint);
        display: flex;
        align-items: center;
        gap: 8px;
        /*background-color: var(--color-base-30);*/
        justify-content: center;
    }

    .select-elements {
        /*width: 468px;*/
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        & select {
            font-size: 12px;
            width: 130px;
        }
    }
</style>
