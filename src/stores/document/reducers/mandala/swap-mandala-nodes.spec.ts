import { describe, expect, it } from 'vitest';
import { defaultDocumentState } from 'src/stores/document/default-document-state';
import { documentReducer } from 'src/stores/document/document-reducer';

describe('document/mandala/swap', () => {
    it('swaps whole subtree section mappings instead of only root content', () => {
        const state = defaultDocumentState();
        state.meta.mandalaV2.enabled = true;
        state.sections.section_id = {
            '1': 'n1',
            '2': 'n2',
            '2.3': 'n23',
            '2.7': 'n27',
            '2.3.1': 'n231',
            '2.3.7': 'n237',
            '2.7.2': 'n272',
        };
        state.sections.id_section = {
            n1: '1',
            n2: '2',
            n23: '2.3',
            n27: '2.7',
            n231: '2.3.1',
            n237: '2.3.7',
            n272: '2.7.2',
        };
        state.document.content = {
            n1: { content: '' },
            n2: { content: '' },
            n23: { content: 'source root' },
            n27: { content: 'target root' },
            n231: { content: 'source child 1' },
            n237: { content: 'source child 7' },
            n272: { content: 'target child 2' },
        };
        state.pinnedNodes.Ids = ['n23'];

        documentReducer(state, {
            type: 'document/mandala/swap',
            payload: {
                sourceNodeId: 'n23',
                targetNodeId: 'n27',
            },
        });

        expect(state.sections.id_section).toMatchObject({
            n23: '2.7',
            n27: '2.3',
            n231: '2.7.1',
            n237: '2.7.7',
            n272: '2.3.2',
        });
        expect(state.sections.section_id).toMatchObject({
            '2.7': 'n23',
            '2.3': 'n27',
            '2.7.1': 'n231',
            '2.7.7': 'n237',
            '2.3.2': 'n272',
        });
        expect(state.pinnedNodes.Ids).toEqual(['n23']);
        expect(state.meta.mandalaV2.parentToChildrenSlots['2'][3]).toBe('2.3');
        expect(state.meta.mandalaV2.parentToChildrenSlots['2'][7]).toBe('2.7');
        expect(state.meta.mandalaV2.parentToChildrenSlots['2.7'][1]).toBe(
            '2.7.1',
        );
        expect(state.meta.mandalaV2.parentToChildrenSlots['2.7'][7]).toBe(
            '2.7.7',
        );
        expect(state.meta.mandalaV2.parentToChildrenSlots['2.3'][2]).toBe(
            '2.3.2',
        );
    });
});
