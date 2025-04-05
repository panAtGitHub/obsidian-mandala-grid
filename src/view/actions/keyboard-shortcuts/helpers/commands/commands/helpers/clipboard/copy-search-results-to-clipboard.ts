import { LineageView } from 'src/view/view';
import { getSearchResultsFromDocument } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/get-search-results-from-document';

export const copySearchResultsToClipboard = async (view: LineageView) => {
    const results = Array.from(view.viewStore.getValue().search.results.keys());
    const documentState = view.documentStore.getValue();
    const outline = getSearchResultsFromDocument(
        results,
        documentState.document,
        documentState.sections,
    );

    await navigator.clipboard.writeText(outline);
};
