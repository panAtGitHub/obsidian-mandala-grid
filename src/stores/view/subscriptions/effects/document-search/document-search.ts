import { MandalaView } from 'src/view/view';
import Fuse, { FuseResult } from 'fuse.js';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import { DocumentState } from 'src/stores/document/document-state-type';

type SearchItem = { sectionId: string; nodeId: string; content: string };

export type NodeSearchResult = FuseResult<SearchItem>;

const STRUCTURAL_ACTIONS = new Set<DocumentStoreAction['type']>([
    'document/mandala/ensure-children',
    'document/mandala/ensure-core-theme',
    'document/mandala/clear-empty-subgrids',
]);

export class DocumentSearch {
    constructor(private view: MandalaView) {}
    private fuse: Fuse<SearchItem> | null = null;
    private fuzzySearch = false;
    private collection = new Map<string, SearchItem>();
    private collectionInitialized = false;

    private buildCollectionFromDocument = (documentState: DocumentState) => {
        this.collection.clear();
        for (const [sectionId, nodeId] of Object.entries(
            documentState.sections.section_id,
        )) {
            const content =
                documentState.document.content[nodeId]?.content ?? '';
            if (content.length === 0) continue;
            this.collection.set(sectionId, {
                sectionId,
                nodeId,
                content,
            });
        }
        this.collectionInitialized = true;
    };

    private rebuildFuse = (fuzzySearch: boolean) => {
        this.fuzzySearch = fuzzySearch;
        this.fuse = new Fuse([...this.collection.values()], {
            keys: ['content'],
            threshold: fuzzySearch ? 0.4 : 0,
            shouldSort: true,
            isCaseSensitive: false,
            ignoreLocation: true,
        });
    };

    private ensureCollectionAndFuse = () => {
        const documentState = this.view.documentStore.getValue();
        const fuzzySearch = this.view.viewStore.getValue().search.fuzzySearch;
        if (!this.collectionInitialized) {
            this.buildCollectionFromDocument(documentState);
        }
        if (!this.fuse || this.fuzzySearch !== fuzzySearch) {
            this.rebuildFuse(fuzzySearch);
        }
    };

    private upsertSection = (
        documentState: DocumentState,
        sectionId: string,
    ) => {
        const nodeId = documentState.sections.section_id[sectionId];
        if (!nodeId) {
            this.collection.delete(sectionId);
            return;
        }
        const content = documentState.document.content[nodeId]?.content ?? '';
        if (content.length === 0) {
            this.collection.delete(sectionId);
            return;
        }
        this.collection.set(sectionId, {
            sectionId,
            nodeId,
            content,
        });
    };

    private updateFuseCollection = () => {
        if (!this.fuse) return;
        this.fuse.setCollection([...this.collection.values()]);
    };

    applyDocumentAction = (
        action: DocumentStoreAction,
        documentState: DocumentState,
    ) => {
        if (action.type === 'document/file/load-from-disk') {
            this.collectionInitialized = false;
            this.collection.clear();
            this.fuse = null;
            return;
        }

        if (!this.collectionInitialized) {
            // lazy init keeps startup cheap
            return;
        }

        if (action.type === 'document/update-node-content') {
            const sectionId =
                documentState.sections.id_section[action.payload.nodeId];
            if (!sectionId) return;
            this.upsertSection(documentState, sectionId);
            this.updateFuseCollection();
            return;
        }

        if (action.type === 'document/update-multiple-node-content') {
            for (const update of action.payload.updates) {
                const sectionId =
                    documentState.sections.id_section[update.nodeId];
                if (!sectionId) continue;
                this.upsertSection(documentState, sectionId);
            }
            this.updateFuseCollection();
            return;
        }

        if (action.type === 'document/mandala/swap') {
            const mutation = documentState.meta.mandalaV2.lastMutation;
            if (mutation?.actionType === action.type && !mutation.structural) {
                if (mutation.changedSections.length > 0) {
                    for (const sectionId of mutation.changedSections) {
                        this.upsertSection(documentState, sectionId);
                    }
                    this.updateFuseCollection();
                }
                return;
            }
            this.collectionInitialized = false;
            this.fuse = null;
            return;
        }

        if (STRUCTURAL_ACTIONS.has(action.type)) {
            this.collectionInitialized = false;
            this.fuse = null;
        }
    };

    resetIndex = () => {
        this.fuse = null;
    };

    resetAll = () => {
        this.collectionInitialized = false;
        this.collection.clear();
        this.fuse = null;
    };

    search = (query: string) => {
        this.ensureCollectionAndFuse();
        const results = this.fuse!.search(query);
        const map: Map<string, NodeSearchResult> = new Map();
        for (const result of results) {
            map.set(result.item.sectionId, result);
        }
        return map;
    };
}
