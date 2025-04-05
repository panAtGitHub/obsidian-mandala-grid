<script lang="ts">
    import { Copy } from 'lucide-svelte';
    import Button from '../../shared/button.svelte';
    import { Menu } from 'obsidian';
    import { getView } from 'src/view/components/container/context';
    import {
        copyFlatSearchResultsToClipboard
    } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-flat-search-results-to-clipboard';
    import {
        copySearchResultsToClipboard
    } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-search-results-to-clipboard';
    import {
        cutSearchResults
    } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/cut-search-results';
    import { lang } from 'src/lang/lang';

    const view = getView();
    const showContextMenu = (e: MouseEvent) => {
        const menu = new Menu();
        menu.addItem((item) => {
            item.setTitle(lang.toolbar_copy_search_results);
            item.setIcon('copy');
            item.onClick(() => copySearchResultsToClipboard(view));
        });
        menu.addItem((item) => {
            item.setTitle(lang.toolbar_copy_search_results_wo_subitems);
            item.setIcon('copy');
            item.onClick(() => copyFlatSearchResultsToClipboard(view));

        });
        menu.addItem((item) => {
            item.setTitle(lang.toolbar_cut_search_results);
            item.setIcon('scissors');
            item.onClick(() => cutSearchResults(view));
        });
        menu.showAtMouseEvent(e);
    };
</script>

<div class="search-container buttons-group">
    <Button
        label={'Search actions'}
        on:click={showContextMenu}
        tooltipPosition="bottom"
    >
        <Copy class="svg-icon" size="12" />
    </Button>
</div>

<style>
    .search-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--size-4-2);
    }
</style>
