import { describe, expect, it } from 'vitest';
import { buildMandalaDocumentV2 } from 'src/mandala-document/engine/build-state';
import { parseSections } from 'src/mandala-document/engine/parse-sections';
import { prepareSaveSections } from 'src/mandala-document/engine/prepare-save-sections';
import { serializeSections } from 'src/mandala-document/engine/serialize-sections';
import { validateSectionsStructure } from 'src/mandala-document/engine/validate-structure';

describe('mandala-v2 parser', () => {
    it('parses section markers and content blocks', () => {
        const markdown = [
            '<!--section: 1-->',
            'Root',
            '<!--section: 1.1-->',
            'Child',
            '<!--section: 2-->',
            'Sibling',
        ].join('\n');

        const parsed = parseSections(markdown);

        expect(parsed.sections.map((section) => section.id)).toEqual([
            '1',
            '1.1',
            '2',
        ]);
        expect(parsed.sections[0].content).toBe('Root');
        expect(parsed.sections[1].content).toBe('Child');
        expect(parsed.sections[2].content).toBe('Sibling');
    });
});

describe('mandala-v2 validator', () => {
    it('accepts deep and sparse mandala section structures', () => {
        const parsed = [
            { id: '1', content: '', markerStart: 0, markerEnd: 0 },
            { id: '2', content: '', markerStart: 0, markerEnd: 0 },
            { id: '2.7', content: '', markerStart: 0, markerEnd: 0 },
            { id: '2.7.1', content: '', markerStart: 0, markerEnd: 0 },
        ];

        const errors = validateSectionsStructure(parsed);

        expect(errors).toEqual([]);
    });

    it('rejects invalid slot ids and missing parents', () => {
        const parsed = [
            { id: '1', content: '', markerStart: 0, markerEnd: 0 },
            { id: '2.9', content: '', markerStart: 0, markerEnd: 0 },
            { id: '3.1', content: '', markerStart: 0, markerEnd: 0 },
        ];

        const errors = validateSectionsStructure(parsed);
        const reasons = errors.map((error) => error.reason);

        expect(reasons).toContain('Subgrid slot index must be within 1..8');
        expect(reasons).toContain('Missing parent section "2"');
        expect(reasons).toContain('Missing parent section "3"');
    });

    it('requires root sections to be continuous', () => {
        const parsed = [
            { id: '1', content: '', markerStart: 0, markerEnd: 0 },
            { id: '3', content: '', markerStart: 0, markerEnd: 0 },
        ];

        const errors = validateSectionsStructure(parsed);

        expect(
            errors.some((error) => error.reason.includes('continuous')),
        ).toBe(true);
    });
});

describe('mandala-v2 builder', () => {
    it('builds bidirectional section/node indexes', () => {
        const parsed = [
            { id: '1', content: 'A', markerStart: 0, markerEnd: 0 },
            { id: '2', content: 'B', markerStart: 0, markerEnd: 0 },
            { id: '2.7', content: 'C', markerStart: 0, markerEnd: 0 },
        ];

        const document = buildMandalaDocumentV2({ sections: parsed });
        const nodeId = document.sectionToNode['2.7'];

        expect(nodeId).toBeTruthy();
        expect(document.nodeToSection[nodeId]).toBe('2.7');
        expect(document.parentToChildrenSlots['2'][7]).toBe('2.7');
        expect(document.content[nodeId].content).toBe('C');
    });
});

describe('mandala-v2 serializer', () => {
    it('serializes with stable deterministic ordering', () => {
        const sections = [
            { sectionId: '2.7', content: 'B' },
            { sectionId: '1', content: 'A' },
            { sectionId: '2', content: 'C' },
        ];

        const first = serializeSections(sections);
        const second = serializeSections(sections);

        expect(first).toBe(second);
        expect(first).toBe(
            [
                '<!--section: 1-->',
                'A',
                '<!--section: 2-->',
                'C',
                '<!--section: 2.7-->',
                'B',
            ].join('\n'),
        );
    });

    it('keeps data on parse -> serialize -> parse round trip', () => {
        const markdown = [
            '<!--section: 1-->',
            'A',
            '<!--section: 2-->',
            'B',
            '<!--section: 2.7-->',
            'C',
        ].join('\n');
        const parsed = parseSections(markdown);
        const serialized = serializeSections(
            parsed.sections.map((section) => ({
                sectionId: section.id,
                content: section.content,
            })),
        );
        const parsedAgain = parseSections(serialized);

        expect(parsedAgain.sections.map((section) => section.id)).toEqual([
            '1',
            '2',
            '2.7',
        ]);
        expect(parsedAgain.sections.map((section) => section.content)).toEqual([
            'A',
            'B',
            'C',
        ]);
    });

    it('preserves whitespace-only content as non-empty text', () => {
        const markdown = [
            '<!--section: 1-->',
            ' ',
            '<!--section: 2-->',
            '',
        ].join('\n');
        const parsed = parseSections(markdown);
        const serialized = serializeSections(
            parsed.sections.map((section) => ({
                sectionId: section.id,
                content: section.content,
            })),
        );
        const parsedAgain = parseSections(serialized);

        expect(parsedAgain.sections[0].content).toBe(' ');
        expect(parsedAgain.sections[1].content).toBe('');
    });
});

describe('mandala-v2 save prepare', () => {
    it('prunes fully empty 8-slot subgrids', () => {
        const sections = {
            section_id: {
                '1': 'n1',
                '1.1': 'n11',
                '1.2': 'n12',
                '1.3': 'n13',
                '1.4': 'n14',
                '1.5': 'n15',
                '1.6': 'n16',
                '1.7': 'n17',
                '1.8': 'n18',
                '2': 'n2',
            },
            id_section: {
                n1: '1',
                n11: '1.1',
                n12: '1.2',
                n13: '1.3',
                n14: '1.4',
                n15: '1.5',
                n16: '1.6',
                n17: '1.7',
                n18: '1.8',
                n2: '2',
            },
        };
        const document = {
            content: {
                n1: { content: 'Root' },
                n11: { content: '' },
                n12: { content: '' },
                n13: { content: '' },
                n14: { content: '' },
                n15: { content: '' },
                n16: { content: '' },
                n17: { content: '' },
                n18: { content: '' },
                n2: { content: 'B' },
            },
        };

        const result = prepareSaveSections(document, sections);

        expect(result.blockedReasons).toEqual([]);
        expect(result.sections.map((section) => section.sectionId)).toEqual([
            '1',
            '2',
        ]);
        expect(result.stats.prunedParentCount).toBe(1);
    });

    it('prunes whitespace-only 8-slot subgrids', () => {
        const sections = {
            section_id: {
                '1': 'n1',
                '1.1': 'n11',
                '1.2': 'n12',
                '1.3': 'n13',
                '1.4': 'n14',
                '1.5': 'n15',
                '1.6': 'n16',
                '1.7': 'n17',
                '1.8': 'n18',
                '2': 'n2',
            },
            id_section: {
                n1: '1',
                n11: '1.1',
                n12: '1.2',
                n13: '1.3',
                n14: '1.4',
                n15: '1.5',
                n16: '1.6',
                n17: '1.7',
                n18: '1.8',
                n2: '2',
            },
        };
        const document = {
            content: {
                n1: { content: 'Root' },
                n11: { content: '\n' },
                n12: { content: '   ' },
                n13: { content: '\n\n' },
                n14: { content: '\t' },
                n15: { content: '' },
                n16: { content: ' \n ' },
                n17: { content: '\r\n' },
                n18: { content: '' },
                n2: { content: 'B' },
            },
        };

        const result = prepareSaveSections(document, sections);

        expect(result.blockedReasons).toEqual([]);
        expect(result.sections.map((section) => section.sectionId)).toEqual([
            '1',
            '2',
        ]);
        expect(result.stats.prunedParentCount).toBe(1);
    });

    it('blocks save when direct slots are empty but deeper descendants are not', () => {
        const sections = {
            section_id: {
                '1': 'n1',
                '1.1': 'n11',
                '1.2': 'n12',
                '1.3': 'n13',
                '1.4': 'n14',
                '1.5': 'n15',
                '1.6': 'n16',
                '1.7': 'n17',
                '1.8': 'n18',
                '1.1.1': 'n111',
            },
            id_section: {
                n1: '1',
                n11: '1.1',
                n12: '1.2',
                n13: '1.3',
                n14: '1.4',
                n15: '1.5',
                n16: '1.6',
                n17: '1.7',
                n18: '1.8',
                n111: '1.1.1',
            },
        };
        const document = {
            content: {
                n1: { content: 'Root' },
                n11: { content: '' },
                n12: { content: '' },
                n13: { content: '' },
                n14: { content: '' },
                n15: { content: '' },
                n16: { content: '' },
                n17: { content: '' },
                n18: { content: '' },
                n111: { content: 'deep' },
            },
        };

        const result = prepareSaveSections(document, sections);

        expect(result.blockedReasons.length).toBe(1);
        expect(result.stats.blockedParentCount).toBe(1);
    });

    it('prunes trailing empty core sections after subgrid cleanup', () => {
        const sections = {
            section_id: {
                '1': 'n1',
                '1.1': 'n11',
                '1.2': 'n12',
                '1.3': 'n13',
                '1.4': 'n14',
                '1.5': 'n15',
                '1.6': 'n16',
                '1.7': 'n17',
                '1.8': 'n18',
                '2': 'n2',
            },
            id_section: {
                n1: '1',
                n11: '1.1',
                n12: '1.2',
                n13: '1.3',
                n14: '1.4',
                n15: '1.5',
                n16: '1.6',
                n17: '1.7',
                n18: '1.8',
                n2: '2',
            },
        };
        const document = {
            content: {
                n1: { content: 'Root' },
                n11: { content: '' },
                n12: { content: '' },
                n13: { content: '' },
                n14: { content: '' },
                n15: { content: '' },
                n16: { content: '' },
                n17: { content: '' },
                n18: { content: '' },
                n2: { content: '' },
            },
        };

        const result = prepareSaveSections(document, sections);

        expect(result.blockedReasons).toEqual([]);
        expect(result.sections.map((section) => section.sectionId)).toEqual([
            '1',
        ]);
        expect(result.stats.prunedParentCount).toBe(1);
        expect(result.stats.prunedRootCount).toBe(1);
    });

    it('does not prune non-trailing empty core sections', () => {
        const sections = {
            section_id: {
                '1': 'n1',
                '2': 'n2',
                '3': 'n3',
            },
            id_section: {
                n1: '1',
                n2: '2',
                n3: '3',
            },
        };
        const document = {
            content: {
                n1: { content: 'Root' },
                n2: { content: '' },
                n3: { content: 'Keep trailing continuity' },
            },
        };

        const result = prepareSaveSections(document, sections);

        expect(result.sections.map((section) => section.sectionId)).toEqual([
            '1',
            '2',
            '3',
        ]);
        expect(result.stats.prunedRootCount).toBe(0);
    });

    it('never removes the last remaining root section 1', () => {
        const sections = {
            section_id: {
                '1': 'n1',
            },
            id_section: {
                n1: '1',
            },
        };
        const document = {
            content: {
                n1: { content: '' },
            },
        };

        const result = prepareSaveSections(document, sections);

        expect(result.sections.map((section) => section.sectionId)).toEqual([
            '1',
        ]);
        expect(result.stats.prunedRootCount).toBe(0);
    });
});
