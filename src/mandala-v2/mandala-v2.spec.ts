import { describe, expect, it } from 'vitest';
import { buildMandalaDocumentV2 } from 'src/mandala-v2/build-state';
import { parseSections } from 'src/mandala-v2/parse-sections';
import { serializeSections } from 'src/mandala-v2/serialize-sections';
import { validateSectionsStructure } from 'src/mandala-v2/validate-structure';

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

        expect(errors.some((error) => error.reason.includes('continuous'))).toBe(
            true,
        );
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
            ['<!--section: 1-->', 'A', '<!--section: 2-->', 'C', '<!--section: 2.7-->', 'B'].join(
                '\n',
            ),
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
});
