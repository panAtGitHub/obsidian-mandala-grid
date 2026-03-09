import { describe, expect, it } from 'vitest';
import { defaultDocumentState } from 'src/stores/document/default-document-state';
import {
    applyMandalaContentDelta,
    buildSubtreeNonEmptyCountBySection,
    rebuildMandalaV2MetaFromSections,
} from 'src/stores/document/reducers/mandala/mandala-slot-authority';

describe('mandala-slot-authority', () => {
    it('builds subtree non-empty counts from section tree', () => {
        const sections = {
            section_id: {
                '1': 'n1',
                '1.1': 'n11',
                '1.2': 'n12',
                '1.1.1': 'n111',
            },
            id_section: {
                n1: '1',
                n11: '1.1',
                n12: '1.2',
                n111: '1.1.1',
            },
        };
        const content = {
            n1: { content: '' },
            n11: { content: '' },
            n12: { content: 'B' },
            n111: { content: 'C' },
        };

        const counts = buildSubtreeNonEmptyCountBySection(content, sections);

        expect(counts['1.1.1']).toBe(1);
        expect(counts['1.1']).toBe(1);
        expect(counts['1.2']).toBe(1);
        expect(counts['1']).toBe(2);
    });

    it('ignores whitespace-only mandala content in subtree counts', () => {
        const sections = {
            section_id: {
                '1': 'n1',
                '1.1': 'n11',
                '1.2': 'n12',
            },
            id_section: {
                n1: '1',
                n11: '1.1',
                n12: '1.2',
            },
        };
        const content = {
            n1: { content: '\n' },
            n11: { content: ' \n\t' },
            n12: { content: 'B' },
        };

        const counts = buildSubtreeNonEmptyCountBySection(content, sections);

        expect(counts['1.1']).toBe(0);
        expect(counts['1.2']).toBe(1);
        expect(counts['1']).toBe(1);
    });

    it('applies content delta only along ancestor chain', () => {
        const state = defaultDocumentState();
        state.meta.mandalaV2.enabled = true;
        state.sections.section_id = {
            '1': 'n1',
            '1.1': 'n11',
            '1.1.1': 'n111',
        };
        state.sections.id_section = {
            n1: '1',
            n11: '1.1',
            n111: '1.1.1',
        };
        state.meta.mandalaV2.subtreeNonEmptyCountBySection = {
            '1': 0,
            '1.1': 0,
            '1.1.1': 0,
        };

        applyMandalaContentDelta(state, 'n111', '', 'x');

        expect(state.meta.mandalaV2.subtreeNonEmptyCountBySection).toEqual({
            '1': 1,
            '1.1': 1,
            '1.1.1': 1,
        });
    });

    it('rebuilds slots and counts in one pass', () => {
        const state = defaultDocumentState();
        state.meta.mandalaV2.enabled = true;
        state.meta.mandalaV2.revision = 5;
        state.sections.section_id = {
            '1': 'n1',
            '1.1': 'n11',
            '1.8': 'n18',
            '1.8.2': 'n182',
        };
        state.sections.id_section = {
            n1: '1',
            n11: '1.1',
            n18: '1.8',
            n182: '1.8.2',
        };
        state.document.content = {
            n1: { content: '' },
            n11: { content: '' },
            n18: { content: '' },
            n182: { content: 'leaf' },
        };

        rebuildMandalaV2MetaFromSections(state, { bumpRevision: false });

        expect(state.meta.mandalaV2.revision).toBe(5);
        expect(state.meta.mandalaV2.parentToChildrenSlots['1'][1]).toBe('1.1');
        expect(state.meta.mandalaV2.parentToChildrenSlots['1'][8]).toBe('1.8');
        expect(state.meta.mandalaV2.parentToChildrenSlots['1.8'][2]).toBe(
            '1.8.2',
        );
        expect(state.meta.mandalaV2.subtreeNonEmptyCountBySection['1.8']).toBe(
            1,
        );
        expect(state.meta.mandalaV2.subtreeNonEmptyCountBySection['1']).toBe(1);
    });
});
