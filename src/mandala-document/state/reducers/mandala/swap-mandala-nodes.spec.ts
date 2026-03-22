import { describe, expect, it } from 'vitest';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import { documentReducer } from 'src/mandala-document/state/document-reducer';

const getContentBySection = (
    state: ReturnType<typeof defaultDocumentState>,
    sectionId: string,
) => {
    const nodeId = state.sections.section_id[sectionId];
    if (!nodeId) return null;
    return state.document.content[nodeId]?.content ?? '';
};

const getPinnedSections = (state: ReturnType<typeof defaultDocumentState>) =>
    state.pinnedNodes.Ids.map((nodeId) => state.sections.id_section[nodeId])
        .filter((sectionId): sectionId is string => Boolean(sectionId))
        .sort();

describe('document/mandala/swap', () => {
    it('keeps slot mappings fixed for same-shape subtree swaps', () => {
        const state = defaultDocumentState();
        state.meta.mandalaV2.enabled = true;
        state.sections.section_id = {
            '1': 'n1',
            '2': 'n2',
            '2.3': 'n23',
            '2.7': 'n27',
            '2.3.1': 'n231',
            '2.7.1': 'n271',
        };
        state.sections.id_section = {
            n1: '1',
            n2: '2',
            n23: '2.3',
            n27: '2.7',
            n231: '2.3.1',
            n271: '2.7.1',
        };
        state.document.content = {
            n1: { content: '' },
            n2: { content: '' },
            n23: { content: 'source root' },
            n27: { content: 'target root' },
            n231: { content: 'source child' },
            n271: { content: 'target child' },
        };
        state.pinnedNodes.Ids = ['n23', 'n231'];

        documentReducer(state, {
            type: 'document/mandala/swap',
            payload: {
                sourceNodeId: 'n23',
                targetNodeId: 'n27',
            },
        });

        expect(state.sections.id_section).toEqual({
            n1: '1',
            n2: '2',
            n23: '2.3',
            n27: '2.7',
            n231: '2.3.1',
            n271: '2.7.1',
        });
        expect(getContentBySection(state, '2.3')).toBe('target root');
        expect(getContentBySection(state, '2.7')).toBe('source root');
        expect(getContentBySection(state, '2.3.1')).toBe('target child');
        expect(getContentBySection(state, '2.7.1')).toBe('source child');
        expect(getPinnedSections(state)).toEqual(['2.7', '2.7.1']);
        expect(state.meta.mandalaV2.lastMutation).toEqual({
            actionType: 'document/mandala/swap',
            changedSections: ['2.3', '2.3.1', '2.7', '2.7.1'],
            structural: false,
        });
    });

    it('moves asymmetric subtree payload by materializing target slots and pruning emptied source slots', () => {
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
        state.pinnedNodes.Ids = ['n23', 'n231'];

        documentReducer(state, {
            type: 'document/mandala/swap',
            payload: {
                sourceNodeId: 'n23',
                targetNodeId: 'n27',
            },
        });

        expect(state.sections.id_section.n23).toBe('2.3');
        expect(state.sections.id_section.n27).toBe('2.7');
        expect(state.sections.section_id['2.3.1']).toBeUndefined();
        expect(state.sections.section_id['2.3.7']).toBeUndefined();
        expect(state.sections.section_id['2.7.2']).toBeUndefined();
        expect(state.sections.section_id['2.3.2']).toBeTruthy();
        expect(state.sections.section_id['2.7.1']).toBeTruthy();
        expect(state.sections.section_id['2.7.7']).toBeTruthy();
        expect(getContentBySection(state, '2.3')).toBe('target root');
        expect(getContentBySection(state, '2.7')).toBe('source root');
        expect(getContentBySection(state, '2.3.2')).toBe('target child 2');
        expect(getContentBySection(state, '2.7.1')).toBe('source child 1');
        expect(getContentBySection(state, '2.7.7')).toBe('source child 7');
        expect(getPinnedSections(state)).toEqual(['2.7', '2.7.1']);
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
        expect(state.meta.mandalaV2.lastMutation).toEqual({
            actionType: 'document/mandala/swap',
            changedSections: [
                '2.3',
                '2.3.1',
                '2.3.2',
                '2.3.7',
                '2.7',
                '2.7.1',
                '2.7.2',
                '2.7.7',
            ],
            structural: true,
        });
    });
});

describe('document/mandala/clear-empty-subgrids', () => {
    it('removes trailing empty core nodes from the document and section index', () => {
        const state = defaultDocumentState();
        state.meta.mandalaV2.enabled = true;
        state.sections.section_id = {
            '1': 'n1',
            '2': 'n2',
            '3': 'n3',
        };
        state.sections.id_section = {
            n1: '1',
            n2: '2',
            n3: '3',
        };
        state.document.columns = [
            {
                id: 'c0',
                groups: [{ parentId: 'root', nodes: ['n1', 'n2', 'n3'] }],
            },
        ];
        state.document.content = {
            n1: { content: 'keep' },
            n2: { content: '' },
            n3: { content: '' },
        };

        documentReducer(state, {
            type: 'document/mandala/clear-empty-subgrids',
            payload: {
                parentIds: [],
                rootNodeIds: ['n2', 'n3'],
                activeNodeId: 'n1',
            },
        });

        expect(state.sections.section_id).toEqual({
            '1': 'n1',
        });
        expect(state.document.columns[0]?.groups[0]?.nodes).toEqual(['n1']);
        expect(state.document.content.n2).toBeUndefined();
        expect(state.document.content.n3).toBeUndefined();
    });
});
