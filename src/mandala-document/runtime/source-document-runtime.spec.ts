import { describe, expect, it } from 'vitest';
import {
    MandalaSourceRuntime,
    StaleSourceRevisionError,
    projectWorkingSetDocumentState,
} from 'src/mandala-document/runtime/source-document-runtime';
import { buildMandalaDocumentV2 } from 'src/mandala-document/engine/build-state';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import { buildSectionIndex } from 'src/mandala-document/runtime/section-index';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';

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
    it('keeps incoming YAML when bootstrapping and replacing a working set', () => {
        const yaml =
            '---\nmandala: true\ncustom: keep me\nmandala_plan:\n  enabled: true\n  year: 2026\n---\n';
        const markdown =
            yaml + '<!--section: 1-->first\n<!--section: 2-->second';
        const { body, frontmatter } = extractFrontmatter(markdown);
        const runtime = new MandalaSourceRuntime(body);
        const first = projectWorkingSetDocumentState(
            defaultDocumentState(),
            runtime,
            runtime.materialize(['1']),
            frontmatter,
        );
        expect(first.file.frontmatter).toBe(yaml);
        const next = projectWorkingSetDocumentState(
            first,
            runtime,
            runtime.materialize(['2']),
            frontmatter,
        );
        expect(next.file.frontmatter + runtime.source).toBe(markdown);
    });

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

describe('incremental source offsets', () => {
    it.each(['\n', '\r\n'])(
        'matches a fresh index across repeated multi-section edits (%j)',
        (eol) => {
            const runtime = new MandalaSourceRuntime(
                [
                    '<!--section: 1-->' + eol + 'root',
                    '<!--section: 1.1-->' + eol + 'child',
                    '<!--section: 2-->' + eol + 'other',
                ].join(eol),
            );
            const topology = runtime.index.childrenSlotsByParent;
            const identities = runtime.index.sectionToNodeId;
            const contents = [
                '',
                '甲😀',
                eol,
                'line' + eol + 'two' + eol,
                'z',
                '',
            ];
            for (let i = 0; i < contents.length; i++) {
                const previous = runtime.index;
                const oldRanges = [...previous.byId.values()].map((range) => ({
                    ...range,
                }));
                const previousBytes = previous.sourceBytes;
                const result = runtime.replaceSectionContents([
                    { sectionId: '1', content: contents[i] },
                    {
                        sectionId: '2',
                        content: contents[(i + 2) % contents.length],
                    },
                ]);
                const expected = buildSectionIndex(runtime.source, {
                    sourceRevision: runtime.revision,
                });
                expect(result).not.toBeNull();
                expect(runtime.index.byId).toEqual(expected.byId);
                expect(runtime.index.sourceBytes).toBe(expected.sourceBytes);
                expect(result?.bytesDelta).toBe(
                    expected.sourceBytes - previousBytes,
                );
                expect(runtime.index.childrenSlotsByParent).toBe(topology);
                expect(runtime.index.sectionToNodeId).toBe(identities);
                expect([...previous.byId.values()]).toEqual(oldRanges);
            }
        },
    );

    it('fully validates marker changes and leaves source/revision untouched on rejection', () => {
        const runtime = new MandalaSourceRuntime('<!--section: 1-->root');
        expect(
            runtime.replaceSectionContents([
                { sectionId: '1', content: 'root\n<!--section: 2-->next' },
            ]),
        ).not.toBeNull();
        expect(runtime.index.canonicalOrderedIds).toEqual(['1', '2']);
        const before = runtime.source;
        const revision = runtime.revision;
        expect(
            runtime.replaceSectionContents([
                { sectionId: '2', content: '<!--section: 1-->duplicate' },
            ]),
        ).toBeNull();
        expect(runtime.source).toBe(before);
        expect(runtime.revision).toBe(revision);
    });

    it('retains live node IDs through cooling and subsequent content patches', () => {
        const runtime = new MandalaSourceRuntime(
            '<!--section: 1-->root\n<!--section: 2-->other',
        );
        expect(runtime.retainNodeIds({ '1': 'live-1', '2': 'live-2' })).toBe(
            true,
        );
        runtime.replaceSectionContents([
            { sectionId: '1', content: 'changed' },
        ]);
        const state = projectWorkingSetDocumentState(
            defaultDocumentState(),
            runtime,
            runtime.materialize(['2']),
            '',
        );
        expect(state.sections.section_id['2']).toBe('live-2');
        expect(runtime.getSectionId('live-1')).toBe('1');
        expect(
            runtime.retainNodeIds({ '1': 'duplicate', '2': 'duplicate' }),
        ).toBe(false);
        expect(runtime.getNodeId('1')).toBe('live-1');
    });
});
