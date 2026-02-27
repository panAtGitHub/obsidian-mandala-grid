import { MandalaView } from 'src/view/view';
import { NodeSearchResult } from 'src/stores/view/subscriptions/effects/document-search/document-search';

const searchResultScore = (result: NodeSearchResult) => result.score ?? -1;
const searchResultRefIndex = (result: NodeSearchResult) => result.refIndex ?? -1;

const areSearchResultsEqual = (
    previous: Map<string, NodeSearchResult>,
    next: Map<string, NodeSearchResult>,
) => {
    if (previous.size !== next.size) return false;
    const previousEntries = Array.from(previous.entries());
    const nextEntries = Array.from(next.entries());
    for (let i = 0; i < previousEntries.length; i += 1) {
        const [prevSectionId, prevResult] = previousEntries[i];
        const nextEntry = nextEntries[i];
        if (!nextEntry) return false;
        const [nextSectionId, nextResult] = nextEntry;
        if (prevSectionId !== nextSectionId) return false;
        if (prevResult.item.nodeId !== nextResult.item.nodeId) return false;
        if (prevResult.item.content !== nextResult.item.content) return false;
        if (searchResultScore(prevResult) !== searchResultScore(nextResult)) {
            return false;
        }
        if (searchResultRefIndex(prevResult) !== searchResultRefIndex(nextResult)) {
            return false;
        }
    }
    return true;
};

const areSearchResultKeysEqual = (
    previous: Map<string, NodeSearchResult>,
    next: Map<string, NodeSearchResult>,
) => {
    if (previous.size !== next.size) return false;
    for (const key of previous.keys()) {
        if (!next.has(key)) return false;
    }
    return true;
};

export const updateActiveNodeAfterSearch = (
    view: MandalaView,
    results: string[],
) => {
    // Mandala 模式下不自动跳转，让用户通过 Hover 或键盘手动选择
    if (view.mandalaMode !== null) {
        return;
    }

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

export const updateSearchResults = (view: MandalaView) => {
    const viewState = view.viewStore.getValue();

    const query = viewState.search.query;
    if (!query) return;
    const previousResults = viewState.search.results;
    const results = view.documentSearch.search(query);
    if (!areSearchResultsEqual(previousResults, results)) {
        view.viewStore.dispatch({
            type: 'view/search/set-results',
            payload: {
                results: results,
            },
        });
    }

    if (!areSearchResultKeysEqual(previousResults, results)) {
        updateActiveNodeAfterSearch(view, Array.from(results.keys()));
    }
};
