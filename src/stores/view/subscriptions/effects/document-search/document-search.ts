import { LineageView } from 'src/view/view';
import {
    prepareFuzzySearch,
    prepareSimpleSearch,
    SearchResult,
} from 'obsidian';

type SearchItem = { id: string; content: string };

export type NodeSearchResult = SearchResult;

export class DocumentSearch {
    constructor(private view: LineageView) {}
    #searchTriggeredMinimap: boolean;
    private index: SearchItem[] | null = null;
    private updateIndex = () => {
        const documentState = this.view.documentStore.getValue();
        this.index = [];
        for (const id of Object.keys(documentState.document.content)) {
            const content = documentState.document.content[id]?.content;
            if (content) {
                this.index.push({
                    id,
                    content,
                });
            }
        }
    };

    resetIndex = () => {
        this.index = null;
    };

    search = (query: string) => {
        if (!this.index || this.index.length === 0) {
            this.updateIndex();
        }
        const viewState = this.view.viewStore.getValue();
        const searchUtil = viewState.search.fuzzySearch
            ? prepareFuzzySearch
            : prepareSimpleSearch;
        const results: Map<string, NodeSearchResult> = new Map();
        for (const item of this.index!) {
            const result = searchUtil(query)(item.content);
            if (result) {
                results.set(item.id, result);
            }
        }
        return results;
    };

    get searchTriggeredMinimap() {
        return this.#searchTriggeredMinimap;
    }
    set searchTriggeredMinimap(value: boolean) {
        this.#searchTriggeredMinimap = value;
    }
}
