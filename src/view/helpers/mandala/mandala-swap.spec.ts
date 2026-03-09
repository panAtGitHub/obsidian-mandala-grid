import { describe, expect, it, vi } from 'vitest';
import {
    getMandalaSwapTargets,
    handleMandalaSwapNodeClick,
    shouldBlockMandalaNodeDoubleClickForSwap,
    type MandalaSwapInteractionState,
} from 'src/view/helpers/mandala/mandala-swap';
import { Sections } from 'src/stores/document/document-state-type';

vi.mock('obsidian', () => ({
    Notice: vi.fn(),
}));

const createSwapState = (
    partial: Partial<MandalaSwapInteractionState> = {},
): MandalaSwapInteractionState => ({
    active: false,
    sourceNodeId: null,
    targetNodeIds: new Set<string>(),
    ...partial,
});

describe('mandala-swap interactions', () => {
    it('gets same-depth targets across different parents', () => {
        const sections: Sections = {
            id_section: {
                root: '1',
                source: '1.1.1',
                sibling: '1.1.2',
                crossParent: '1.2.1',
                parentLevel: '1.2',
            },
            section_id: {
                '1': 'root',
                '1.1.1': 'source',
                '1.1.2': 'sibling',
                '1.2.1': 'crossParent',
                '1.2': 'parentLevel',
            },
        };

        const targets = getMandalaSwapTargets(sections, 'source');

        expect(targets.has('sibling')).toBe(true);
        expect(targets.has('crossParent')).toBe(true);
        expect(targets.has('parentLevel')).toBe(false);
        expect(targets.has('root')).toBe(false);
    });

    it('does not consume click when swap mode is inactive', () => {
        const execute = vi.fn();
        const consumed = handleMandalaSwapNodeClick(
            createSwapState({ active: false }),
            'target-node',
            execute,
        );

        expect(consumed).toBe(false);
        expect(execute).not.toHaveBeenCalled();
    });

    it('consumes click without executing when target is invalid', () => {
        const execute = vi.fn();
        const consumed = handleMandalaSwapNodeClick(
            createSwapState({
                active: true,
                sourceNodeId: 'source-node',
                targetNodeIds: new Set(['other-target']),
            }),
            'target-node',
            execute,
        );

        expect(consumed).toBe(true);
        expect(execute).not.toHaveBeenCalled();
    });

    it('executes swap when swap mode is active and target is valid', () => {
        const execute = vi.fn();
        const consumed = handleMandalaSwapNodeClick(
            createSwapState({
                active: true,
                sourceNodeId: 'source-node',
                targetNodeIds: new Set(['target-node']),
            }),
            'target-node',
            execute,
        );

        expect(consumed).toBe(true);
        expect(execute).toHaveBeenCalledOnce();
        expect(execute).toHaveBeenCalledWith('source-node', 'target-node');
    });

    it('blocks double click only when swap mode is active', () => {
        expect(
            shouldBlockMandalaNodeDoubleClickForSwap(
                createSwapState({ active: true }),
            ),
        ).toBe(true);
        expect(
            shouldBlockMandalaNodeDoubleClickForSwap(
                createSwapState({ active: false }),
            ),
        ).toBe(false);
    });
});
