import { describe, expect, it } from 'vitest';
import { parseSections } from 'src/mandala-document/engine/parse-sections';
import {
    buildSectionIndex,
    getSectionContentFromRange,
} from 'src/mandala-document/runtime/section-index';

describe('SectionIndex', () => {
    it('matches parser content while retaining source ranges', () => {
        const source = [
            '<!--section: 1-->\r\nRoot\r\n',
            '<!--section: 1.1-->\r\n子项 😀\r\n',
            '<!--section: 2-->',
        ].join('');
        const parsed = parseSections(source);
        const index = buildSectionIndex(source);

        expect(index.diagnostics.valid).toBe(true);
        expect(index.canonicalOrderedIds).toEqual(['1', '1.1', '2']);
        expect(
            index.canonicalOrderedIds.map((id) =>
                getSectionContentFromRange(source, index.byId.get(id)),
            ),
        ).toEqual(parsed.sections.map((section) => section.content));
        expect(index.byId.get('1.1')).toMatchObject({
            markerStart: source.indexOf('<!--section: 1.1-->'),
            depth: 2,
            parentId: '1',
            slot: 1,
        });
    });

    it('records sparse children, stable node mappings, and roots', () => {
        const index = buildSectionIndex(
            [
                '<!--section: 1-->A',
                '<!--section: 1.8-->B',
                '<!--section: 2-->C',
            ].join('\n'),
        );

        expect(index.rootIds).toEqual(['1', '2']);
        expect(index.childrenSlotsByParent.get('1')).toEqual({ 8: '1.8' });
        expect(index.sectionToNodeId.get('1.8')).toBeTruthy();
        expect(
            index.nodeIdToSection.get(index.sectionToNodeId.get('1.8') ?? ''),
        ).toBe('1.8');
    });

    it('keeps structure validation in the index path', () => {
        const index = buildSectionIndex(
            [
                '<!--section: 1-->',
                '<!--section: 3.9-->',
                '<!--section: 3.9-->',
            ].join('\n'),
        );

        expect(index.diagnostics.valid).toBe(false);
        expect(index.diagnostics.errors.map((error) => error.reason)).toEqual([
            'Subgrid slot index must be within 1..8',
            'Missing parent section "3"',
            'Duplicate section marker',
        ]);
    });

    it('supports EOF and empty section ranges', () => {
        const source = '<!--section: 1-->\n<!--section: 2-->\nText';
        const index = buildSectionIndex(source);

        expect(getSectionContentFromRange(source, index.byId.get('1'))).toBe(
            '',
        );
        expect(getSectionContentFromRange(source, index.byId.get('2'))).toBe(
            'Text',
        );
    });

    it('does not materialize content while building the index', () => {
        const source = '<!--section: 1-->\n' + 'x'.repeat(100_000);
        const index = buildSectionIndex(source);
        const range = index.byId.get('1');

        expect(range?.contentStart).toBeLessThan(range?.contentEnd ?? 0);
        expect(index.byId.get('1')).not.toHaveProperty('content');
    });
});
