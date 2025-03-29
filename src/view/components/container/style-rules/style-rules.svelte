<script lang="ts">
    import {
        ActiveStyleRulesTab,
        DocumentStyleRulesStore,
        GlobalStyleRulesStore
    } from '../../../../stores/settings/derived/style-rules';
    import { getView } from '../context';
    import StyleRulesList from './components/style-rules-list/style-rules-list.svelte';
    import StyleRulesFooter from './components/style-rules-footer.svelte';
    import DraggableModal from '../shared/draggable-modal/draggable-modal.svelte';

    import TabHeader from './components/tab-header/tab-header.svelte';

    const view = getView();

    const activeTab = ActiveStyleRulesTab(view);
    const documentRules = DocumentStyleRulesStore(view);
    const globalRules = GlobalStyleRulesStore(view);

</script>

<DraggableModal>
    <TabHeader />
    <div class="modal-content">
        {#if $activeTab === 'document-rules'}
            <StyleRulesList rules={$documentRules} />
        {:else}
            <StyleRulesList rules={$globalRules} />
        {/if}
    </div>
    <StyleRulesFooter />
</DraggableModal>

<style>
    .modal-content {
        max-width: 100%;
        height: 230px;
        overflow: auto;
    }
</style>
