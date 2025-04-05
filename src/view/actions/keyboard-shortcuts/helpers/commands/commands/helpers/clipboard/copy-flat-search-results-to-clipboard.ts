import { LineageView } from 'src/view/view';
import { sortNodeIdsBySectionNumber } from 'src/lib/tree-utils/sort/sort-node-ids-by-section-number';
import { copyNodesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-nodes-to-clipboard';

export const copyFlatSearchResultsToClipboard = async (view: LineageView) => {
    const results = Array.from(view.viewStore.getValue().search.results.keys());
    const sortedResults = sortNodeIdsBySectionNumber(
        view.documentStore.getValue().sections,
        results,
    );
    await copyNodesToClipboard(view, sortedResults, true);
};
