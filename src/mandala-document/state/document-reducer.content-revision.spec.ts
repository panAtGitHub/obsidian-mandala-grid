import { describe, expect, it } from 'vitest';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import { documentReducer } from 'src/mandala-document/state/document-reducer';

const createContentState = () => {
    const state = defaultDocumentState();
    state.meta.isMandala = true;
    state.meta.mandalaV2.enabled = true;
    state.sections.section_id = {
        '1': 'node-1',
    };
    state.sections.id_section = {
        'node-1': '1',
    };
    state.document.content = {
        'node-1': {
            content: 'Alpha',
        },
    };
    state.history.context.activeSection = '1';
    return state;
};

describe('documentReducer contentRevision', () => {
    it('increments contentRevision for node content updates only when content changes', () => {
        const state = createContentState();

        documentReducer(state, {
            type: 'document/update-node-content',
            payload: {
                nodeId: 'node-1',
                content: 'Beta',
            },
            context: {
                isInSidebar: false,
            },
        });

        expect(state.meta.mandalaV2.contentRevision).toBe(1);

        documentReducer(state, {
            type: 'document/update-node-content',
            payload: {
                nodeId: 'node-1',
                content: 'Beta',
            },
            context: {
                isInSidebar: false,
            },
        });

        expect(state.meta.mandalaV2.contentRevision).toBe(1);
    });

    it('increments contentRevision for format-headings without touching structural revision', () => {
        const state = createContentState();

        documentReducer(state, {
            type: 'document/format-headings',
        });

        expect(state.meta.mandalaV2.contentRevision).toBe(1);
        expect(state.meta.mandalaV2.revision).toBe(0);
    });

    it('increments both revisions when loading from disk', () => {
        const state = defaultDocumentState();

        documentReducer(state, {
            type: 'document/file/load-from-disk',
            payload: {
                activeSection: '1',
                document: {
                    data: [
                        '<!--section: 1-->',
                        'Root',
                        '<!--section: 1.1-->',
                        'Child',
                        '<!--section: 2-->',
                        'Sibling',
                    ].join('\n'),
                    frontmatter: '',
                    position: null,
                },
            },
        });

        expect(state.meta.mandalaV2.revision).toBe(1);
        expect(state.meta.mandalaV2.contentRevision).toBe(1);
    });
});
