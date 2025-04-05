import { LineageView } from 'src/view/view';
import { copySearchResultsToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-search-results-to-clipboard';
import { sortNodeIdsByDepthDesc } from 'src/lib/tree-utils/sort/sort-node-ids-by-depth-desc';

export const cutSearchResults = async (view: LineageView) => {
    copySearchResultsToClipboard(view);
    const viewState = view.viewStore.getValue();
    const documentState = view.documentStore.getValue();
    const results = Array.from(viewState.search.results.keys());
    const sections = documentState.sections;
    const sortedByDepth = sortNodeIdsByDepthDesc(sections, results);
    view.documentStore.dispatch({
        type: 'DOCUMENT/CUT_NODE',
        payload: {
            nodeId: viewState.document.activeNode,
            selectedNodes: new Set(sortedByDepth),
        },
    });
};
