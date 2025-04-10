import { LineageView } from 'src/view/view';
import { copySearchResultsToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-search-results-to-clipboard';
import { sortNodeIdsByDepthDesc } from 'src/lib/tree-utils/sort/sort-node-ids-by-depth-desc';
import { sortNodeIdsBySectionNumber } from 'src/lib/tree-utils/sort/sort-node-ids-by-section-number';

export const cutSearchResults = async (view: LineageView) => {
    copySearchResultsToClipboard(view);
    const viewState = view.viewStore.getValue();
    const documentState = view.documentStore.getValue();
    const results = Array.from(viewState.search.results.keys());
    if (results.length === 0) return;
    const sections = documentState.sections;
    const sortedByDepth = sortNodeIdsByDepthDesc(sections, results);
    const activeNodeIsAMatch = viewState.search.results.has(
        viewState.document.activeNode,
    );
    const activeSearchNode = activeNodeIsAMatch
        ? viewState.document.activeNode
        : sortNodeIdsBySectionNumber(sections, results)[0];
    view.documentStore.dispatch({
        type: 'document/cut-node',
        payload: {
            nodeId: activeSearchNode,
            selectedNodes: new Set(sortedByDepth),
        },
    });
};
