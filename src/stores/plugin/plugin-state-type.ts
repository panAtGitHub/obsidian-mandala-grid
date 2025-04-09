import { DocumentStore } from 'src/view/view';

export type PluginState = {
    documents: {
        [path: string]: {
            documentStore: DocumentStore;
            viewId: string;
        };
    };
};
