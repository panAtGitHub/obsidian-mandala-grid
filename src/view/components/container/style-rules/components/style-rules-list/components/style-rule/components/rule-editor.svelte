<script lang="ts">
    import { StyleRule } from '../../../../../../../../../stores/settings/types/style-rules-types';
    import { getView } from '../../../../../../context';
    import { numericOperators, properties, stringOperators, targets } from '../../../../../helpers/constants';
    import { ruleEditorEventHandlers } from '../../../../../helpers/rule-editor-event-handlers';
    import { styleRulesLang } from '../../../../../../../../../lang/style-rules-lang';

    export let rule: StyleRule;
    const view = getView();

    const h = ruleEditorEventHandlers(view, rule.id);

    $: operatorIsBetween =
        rule.condition.operator === 'between' ||
        rule.condition.operator === 'not-between';
    $: isStringCondition =
        rule.condition.property === 'content' ||
        rule.condition.property === 'headings';
</script>

<div class="rule-editor">
    <div class="select-elements">
        <select
            value={rule.condition.property}
            on:change={h.handlePropertyChange}
            aria-label="Property"
        >
            {#each properties as property (property)}
                <option value={property}
                    >{styleRulesLang.properties[property]}</option
                >
            {/each}
        </select>
        <select
            value={rule.condition.scope}
            on:change={h.handleScopeChange}
            aria-label="Scope"
        >
            {#each targets as target (target)}
                <option value={target}>{styleRulesLang.targets[target]}</option>
            {/each}
        </select>

        <select
            value={rule.condition.operator}
            on:change={h.handleOperatorChange}
            aria-label="Operator"
        >
            {#if isStringCondition}
                {#each stringOperators as operator (operator)}
                    <option value={operator}
                        >{styleRulesLang.operators[operator]}</option
                    >
                {/each}
            {:else}
                {#each numericOperators as operator (operator)}
                    <option value={operator}
                        >{styleRulesLang.operators[operator]}</option
                    >
                {/each}
            {/if}
        </select>
    </div>
    <div class="input-elements">
        {#if !['empty', 'not-empty'].includes(rule.condition.operator)}
            <input
                type={isStringCondition ? 'text' : 'number'}
                value={rule.condition.value}
                on:input={h.handleValueChange}
                placeholder={isStringCondition ? 'Text' : 'Number'}
                style={isStringCondition
                    ? ''
                    : operatorIsBetween
                      ? 'width: 50%'
                      : ''}
                aria-label={operatorIsBetween ? 'Value 1' : 'Value'}
            />
        {/if}
        {#if operatorIsBetween}
            <input
                type="number"
                value={'valueB' in rule.condition ? rule.condition.valueB : 0}
                on:input={h.handleValueBChange}
                placeholder="Number"
                style="width: 60px"
                aria-label="Value 2"
            />
        {/if}
    </div>
</div>

<style>
    .rule-editor {
        display: flex;
        gap: 8px;
        align-items: center;
        position: relative;
        width: 90%;
        flex: 1;
        flex-wrap: wrap;
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
    .input-elements {
        width: 130px;
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
        & input {
            font-size: 12px;
            width: 100%;
        }
    }


    /* .debug-node-id {
        position: absolute;
        bottom: 0;
        right: 0;
        font-size: 12px;
        color: var(--text-on-accent);
        background-color: var(--color-accent);
    }*/


</style>
