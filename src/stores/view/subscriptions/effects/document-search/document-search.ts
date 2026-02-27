import { MandalaView } from 'src/view/view';
import Fuse, { FuseResult } from 'fuse.js';

type SearchItem = { sectionId: string; nodeId: string; content: string };

export type NodeSearchResult = FuseResult<SearchItem>;

export class DocumentSearch {
    constructor(private view: MandalaView) {}
    private fuse: Fuse<SearchItem> | null;
    #searchTriggeredMinimap: boolean;

    private updateIndex = () => {
        const documentState = this.view.documentStore.getValue();
        const viewState = this.view.viewStore.getValue();
        const items: SearchItem[] = [];
        for (const nodeId of Object.keys(documentState.document.content)) {
            const sectionId = documentState.sections.id_section[nodeId];
            if (!sectionId) continue;
            const content = documentState.document.content[nodeId]?.content;
            if (content) {
                items.push({
                    sectionId,
                    nodeId,
                    content,
                });
            }
        }
        this.fuse = new Fuse(items, {
            keys: ['content'],
            threshold: viewState.search.fuzzySearch ? 0.4 : 0,
            shouldSort: true,
            isCaseSensitive: false,
            ignoreLocation: true,
        });
    };

    resetIndex = () => {
        this.fuse = null;
    };

    search = (query: string) => {
        if (!this.fuse) {
            this.updateIndex();
        }
        const results = this.fuse!.search(query);
        const map: Map<string, NodeSearchResult> = new Map();
        for (const result of results) {
            map.set(result.item.sectionId, result);
        }
        return map;
    };

    get searchTriggeredMinimap() {
        return this.#searchTriggeredMinimap;
    }
    set searchTriggeredMinimap(value: boolean) {
        this.#searchTriggeredMinimap = value;
    }
}
