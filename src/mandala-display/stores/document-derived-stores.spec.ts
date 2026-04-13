import { beforeEach, describe, expect, it, vi } from 'vitest';
import { contentStore } from 'src/mandala-display/stores/document-derived-stores';
import { Store } from 'src/shared/store/store';
import { EditSessionService } from 'src/view/edit-session/edit-session-service';

describe('document-derived-stores contentStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    type TestView = {
        documentStore: Store<
            {
                document: {
                    content: Record<string, { content: string }>;
                };
            },
            { content: string }
        >;
        editSession: EditSessionService;
    };

    const createView = (): TestView => {
        const documentStore = new Store<
            {
                document: {
                    content: Record<string, { content: string }>;
                };
            },
            { content: string }
        >(
            {
                document: {
                    content: {
                        'node-1': {
                            content: 'hello',
                        },
                    },
                },
            },
            () => {
                throw new Error('reducer should not run in contentStore tests');
            },
        );
        const editSession = new EditSessionService(() => undefined);
        return {
            documentStore,
            editSession,
        };
    };

    it('prefers the draft projection for the active editing node', () => {
        const view = createView();
        const values: string[] = [];
        const store = contentStore(view, 'node-1');
        const unsubscribe = store.subscribe((value) => {
            values.push(value);
        });

        view.editSession.startSession('node-1', true, 'hello');
        view.editSession.updateBuffer('hello world');
        vi.advanceTimersByTime(150);

        expect(values.at(-1)).toBe('hello world');
        unsubscribe();
    });

    it('falls back to committed content once the draft is committed', () => {
        const documentStore = new Store(
            {
                document: {
                    content: {
                        'node-1': {
                            content: 'hello',
                        },
                    },
                },
            },
            (state, action: { content: string }) => {
                state.document.content['node-1'].content = action.content;
                return state;
            },
        );
        const editSession = new EditSessionService(({ content }) => {
            documentStore.dispatch({ content });
        });
        const view: TestView = {
            documentStore,
            editSession,
        };
        const values: string[] = [];
        const unsubscribe = contentStore(view, 'node-1').subscribe((value) => {
            values.push(value);
        });

        editSession.startSession('node-1', false, 'hello');
        editSession.updateBuffer('hello world');
        vi.advanceTimersByTime(600);

        expect(values.at(-1)).toBe('hello world');
        expect(editSession.getProjectionSnapshot()).toBe(null);
        unsubscribe();
    });
});
