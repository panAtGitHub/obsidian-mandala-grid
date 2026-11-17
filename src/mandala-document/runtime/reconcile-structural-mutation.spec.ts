import { describe, expect, it } from 'vitest';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import {
    MandalaSourceRuntime,
    projectWorkingSetDocumentState,
} from 'src/mandala-document/runtime/source-document-runtime';
import { reconcileStructuralMutation } from 'src/mandala-document/runtime/reconcile-structural-mutation';
import { documentReducer } from 'src/mandala-document/state/document-reducer';

describe('reconcileStructuralMutation', () => {
    it('preserves sections outside a partially loaded state', () => {
        const source = Array.from(
            { length: 365 },
            (_, index) =>
                `<!--section: ${index + 1}-->\ncontent ${index + 1}\n`,
        ).join('');
        const runtime = new MandalaSourceRuntime(source);
        const state = projectWorkingSetDocumentState(
            defaultDocumentState(),
            runtime,
            runtime.materialize(['1', '3']),
            '',
        );
        state.sections.section_id['1.1'] = 'new';
        state.document.content.new = { content: 'new child' };
        state.document.content[state.sections.section_id['3']].content =
            'stale view content';
        const result = reconcileStructuralMutation(runtime, state, {
            actionType: 'test',
            addedSections: ['1.1'],
            removedSections: [],
            changedSections: [],
            beforeContentBySection: {},
        });
        expect(result).toContain('<!--section: 1.1-->\nnew child');
        expect(result).toContain('<!--section: 2-->\ncontent 2');
        expect(result).toContain('<!--section: 3-->\ncontent 3');
        expect(result).toContain('<!--section: 365-->\ncontent 365');
        expect(runtime.index.rootIds).toHaveLength(365);
    });

    it('rejects removing content changed after the operation began', () => {
        const runtime = new MandalaSourceRuntime(
            '<!--section: 1-->root\n<!--section: 2-->external',
        );
        const state = projectWorkingSetDocumentState(
            defaultDocumentState(),
            runtime,
            runtime.materialize(['1']),
            '',
        );
        expect(() =>
            reconcileStructuralMutation(runtime, state, {
                actionType: 'test',
                addedSections: [],
                removedSections: ['2'],
                changedSections: [],
                beforeContentBySection: { '2': 'original' },
            }),
        ).toThrow();
        expect(runtime.source).toContain('external');
    });

    it('does not delete a descendant added by another view', () => {
        const source =
            '<!--section: 1-->root\n<!--section: 1.1-->old\n<!--section: 1.1.1-->new from another view';
        const runtime = new MandalaSourceRuntime(source);
        const state = defaultDocumentState();
        expect(() =>
            reconcileStructuralMutation(runtime, state, {
                actionType: 'test',
                addedSections: [],
                removedSections: ['1.1'],
                changedSections: [],
                beforeContentBySection: { '1.1': 'old' },
            }),
        ).toThrow('未授权删除');
        expect(runtime.source).toBe(source);
    });

    it('records and applies the exact sections created and cleared by the reducer', () => {
        const source = '<!--section: 1-->root\n<!--section: 2-->keep';
        const runtime = new MandalaSourceRuntime(source);
        const state = defaultDocumentState();
        documentReducer(state, {
            type: 'document/file/load-from-disk',
            payload: {
                document: { data: source, frontmatter: '', position: null },
                activeSection: '1',
            },
        });
        const parent = state.sections.section_id['1'];
        documentReducer(state, {
            type: 'document/mandala/ensure-children',
            payload: { parentNodeId: parent },
        });
        const add = state.meta.mandalaV2.lastStructuralMutation!;
        expect(add.addedSections).toHaveLength(8);
        expect(add.removedSections).toEqual([]);
        expect(reconcileStructuralMutation(runtime, state, add)).toContain(
            '<!--section: 2-->keep',
        );

        documentReducer(state, {
            type: 'document/mandala/clear-empty-subgrids',
            payload: {
                parentIds: [parent],
                rootNodeIds: [],
                activeNodeId: parent,
            },
        });
        const remove = state.meta.mandalaV2.lastStructuralMutation!;
        expect(remove.removedSections).toHaveLength(8);
        expect(reconcileStructuralMutation(runtime, state, remove)).toBe(
            source,
        );
    });
});
