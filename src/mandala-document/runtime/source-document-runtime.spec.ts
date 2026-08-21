import { describe, expect, it } from 'vitest';
import {
    MandalaSourceRuntime,
    StaleSourceRevisionError,
} from 'src/mandala-document/runtime/source-document-runtime';
import { buildMandalaDocumentV2 } from 'src/mandala-document/engine/build-state';

const createDocumentProjection = (
    entries: Array<{ id: string; content: string }>,
) => {
    const built = buildMandalaDocumentV2({
        sections: entries.map((entry) => ({
            ...entry,
            markerStart: 0,
            markerEnd: 0,
        })),
    });
    return {
        sections: {
            section_id: built.sectionToNode,
            id_section: built.nodeToSection,
        },
        document: {
            columns: [],
            content: built.content,
        },
    };
};

describe('MandalaSourceRuntime', () => {
    it('reads current content without materializing other sections', () => {
        const source = [
            '<!--section: 1-->root',
            '<!--section: 1.1-->first',
            '<!--section: 1.2-->second',
            '<!--section: 2-->other',
        ].join('\n');
        const runtime = new MandalaSourceRuntime(source);

        expect(runtime.getContent('1.1')).toBe('first');
        expect(
            runtime.materializeThreeByThree('1').materializedSectionIds,
        ).toEqual(['1', '1.1', '1.2']);
    });

    it('patches multiple sections by descending source offsets and reindexes once', () => {
        const runtime = new MandalaSourceRuntime(
            [
                '<!--section: 1-->root',
                '<!--section: 1.1-->first',
                '<!--section: 1.2-->second',
            ].join('\n'),
        );
        const result = runtime.replaceSectionContents([
            { sectionId: '1.1', content: '甲\n乙' },
            { sectionId: '1.2', content: '😀' },
        ]);

        expect(result?.source).toContain('甲\n乙');
        expect(runtime.getContent('1.1')).toBe('甲\n乙');
        expect(runtime.getContent('1.2')).toBe('😀');
        expect(result?.revision).toBe(1);
    });

    it('preserves the single-marker boundary for empty content', () => {
        const runtime = new MandalaSourceRuntime(
            '<!--section: 1-->root\n<!--section: 2-->other',
        );
        const result = runtime.replaceSectionContents([
            { sectionId: '1', content: '' },
        ]);

        expect(result?.source).toBe(
            '<!--section: 1-->\n<!--section: 2-->other',
        );
        expect(runtime.getContent('1')).toBe('');
    });

    it('rejects stale offsets before applying a patch', () => {
        const runtime = new MandalaSourceRuntime('<!--section: 1-->root');
        runtime.replaceSourceFromExternal('<!--section: 1-->new');

        expect(() =>
            runtime.replaceSectionContents(
                [{ sectionId: '1', content: 'old' }],
                0,
            ),
        ).toThrow(StaleSourceRevisionError);
        expect(runtime.getContent('1')).toBe('new');
    });

    it('reconciles local section insertion and subtree deletion', () => {
        const runtime = new MandalaSourceRuntime(
            [
                '<!--section: 1-->root',
                '<!--section: 1.1-->first',
                '<!--section: 2-->remove me',
            ].join('\n'),
        );
        const state = createDocumentProjection([
            { id: '1', content: 'root' },
            { id: '1.1', content: 'first' },
            { id: '1.2', content: 'new child' },
        ]);

        const result = runtime.reconcileDocumentState(state);

        expect(result?.source).toBe(
            [
                '<!--section: 1-->root',
                '<!--section: 1.1-->first',
                '<!--section: 1.2-->',
                'new child',
            ].join('\n'),
        );
        expect(runtime.index.canonicalOrderedIds).toEqual(['1', '1.1', '1.2']);
        expect(runtime.getContent('1.2')).toBe('new child');
    });

    it('reconciles same-structure content changes without full serialization', () => {
        const runtime = new MandalaSourceRuntime(
            '<!--section: 1-->old\n<!--section: 2-->other',
        );
        const state = createDocumentProjection([
            { id: '1', content: 'updated' },
            { id: '2', content: 'other' },
        ]);

        const result = runtime.reconcileDocumentState(state);

        expect(result?.source).toBe(
            '<!--section: 1-->\nupdated\n<!--section: 2-->other',
        );
        expect(runtime.getContent('1')).toBe('updated');
    });

    it('keeps CRLF boundaries when structurally inserting a section', () => {
        const runtime = new MandalaSourceRuntime(
            '<!--section: 1-->\r\nroot\r\n<!--section: 2-->\r\nother\r\n',
        );
        const state = createDocumentProjection([
            { id: '1', content: 'root' },
            { id: '1.1', content: 'child' },
            { id: '2', content: 'other' },
        ]);

        const result = runtime.reconcileDocumentState(state);

        expect(result?.source).toBe(
            '<!--section: 1-->\r\nroot\r\n' +
                '<!--section: 1.1-->\r\nchild\r\n' +
                '<!--section: 2-->\r\nother\r\n',
        );
        expect(runtime.getContent('1.1')).toBe('child');
    });
});
