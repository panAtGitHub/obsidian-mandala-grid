<script lang="ts">
    import NavigationButtons from '../../../../../../toolbar/components/search/search-navigation-buttons.svelte';

    export let results: string[] | undefined;
</script>

<div class="rule-info">
    <NavigationButtons results={results || []} />
</div>

<style>
    .rule-info {
        width: fit-content;
        padding-top: 4px;
        padding-bottom: 4px;
        padding-right: 8px;
        border-right: 1px solid var(--text-faint);

        display: flex;
        align-items: center;
        /*background-color: var(--color-base-30);*/
        justify-content: center;
    }

</style>
