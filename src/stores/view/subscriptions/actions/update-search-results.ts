import { LineageView } from 'src/view/view';
import { debounce } from 'obsidian';

export const updateActiveNodeAfterSearch = (
    view: LineageView,
    results: string[],
) => {
    const activeNode = view.viewStore.getValue().document.activeNode;
    const shouldUpdateActiveNode =
        results.length > 0 && !results.find((r) => r === activeNode);
    if (shouldUpdateActiveNode) {
        view.viewStore.dispatch({
            type: 'view/set-active-node/search',
            payload: {
                id: results[0],
            },
        });
    }
};

export const updateSearchResults = debounce((view: LineageView) => {
    const viewState = view.viewStore.getValue();

    const query = viewState.search.query;
    if (!query) return;
    const results = view.documentSearch.search(query);
    view.viewStore.dispatch({
        type: 'SEARCH/SET_RESULTS',
        payload: {
            results: results,
        },
    });

    const newSearchResults = Array.from(results.keys()).sort().join('');
    const previousSearchResults = Array.from(viewState.search.results.keys())
        .sort()
        .join('');
    if (previousSearchResults !== newSearchResults) {
        updateActiveNodeAfterSearch(view, Array.from(results.keys()));
    }
}, 100);
