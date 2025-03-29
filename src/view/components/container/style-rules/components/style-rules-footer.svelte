<script lang="ts">
    import { lang } from '../../../../../lang/lang';
    import { getView } from '../../context';

    const view = getView();
    const addRule = () => {
        const documentPath = view.file?.path as string;
        view.plugin.settings.dispatch({
            type: 'settings/style-rules/add',
            payload: { documentPath },
        });
    };
</script>

<div class="modal-footer">
    <button class="add-rule" on:click={addRule}
        >{lang.modals_rules_add_rule}</button
    >
</div>

<style>
    .modal-footer {
        width: 100%;
        padding-bottom: 10px;
        display: flex;
        justify-content: end;
    }
    .add-rule {
        border: none;
        border-radius: 4px;
        cursor: pointer;
        align-self: end;
        margin-right: 10px;
        padding: 8px;
    }
</style>
