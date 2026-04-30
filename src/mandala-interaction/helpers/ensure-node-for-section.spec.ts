import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureChildrenForSection, ensureNodeForSection } from 'src/mandala-interaction/helpers/ensure-node-for-section';

const noticeMock = vi.fn();

vi.mock('obsidian', () => ({
    Notice: function Notice(message: string) {
        noticeMock(message);
    },
}));

describe('ensure-node-for-section', () => {
    beforeEach(() => {
        noticeMock.mockReset();
    });

    it('returns an existing node without dispatching', () => {
        const dispatch = vi.fn();
        const view = {
            documentStore: {
                getValue: () => ({
                    sections: {
                        section_id: {
                            '1.2': 'node-1-2',
                        },
                    },
                }),
                dispatch,
            },
            getEffectiveMandalaSettings: () => ({
                view: {
                    coreSectionMax: 'unlimited',
                },
            }),
        };

        expect(ensureNodeForSection(view as never, '1.2')).toBe('node-1-2');
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('materializes a missing nested section by ensuring the core and each parent level', () => {
        const state = {
            sections: {
                section_id: {} as Record<string, string>,
            },
        };
        const dispatch = vi.fn(
            (action: {
                type: string;
                payload: { theme?: string; parentNodeId?: string };
            }) => {
                if (action.type === 'document/mandala/ensure-core-theme') {
                    state.sections.section_id[action.payload.theme ?? ''] =
                        'node-1';
                }
                if (
                    action.type === 'document/mandala/ensure-children' &&
                    action.payload.parentNodeId === 'node-1'
                ) {
                    state.sections.section_id['1.1'] = 'node-1-1';
                }
                if (
                    action.type === 'document/mandala/ensure-children' &&
                    action.payload.parentNodeId === 'node-1-1'
                ) {
                    state.sections.section_id['1.1.2'] = 'node-1-1-2';
                }
            },
        );
        const view = {
            documentStore: {
                getValue: () => state,
                dispatch,
            },
            getEffectiveMandalaSettings: () => ({
                view: {
                    coreSectionMax: 'unlimited',
                },
            }),
        };

        expect(ensureNodeForSection(view as never, '1.1.2')).toBe(
            'node-1-1-2',
        );
        expect(dispatch.mock.calls).toEqual([
            [
                {
                    type: 'document/mandala/ensure-core-theme',
                    payload: { theme: '1' },
                },
            ],
            [
                {
                    type: 'document/mandala/ensure-children',
                    payload: { parentNodeId: 'node-1', count: 8 },
                },
            ],
            [
                {
                    type: 'document/mandala/ensure-children',
                    payload: { parentNodeId: 'node-1-1', count: 8 },
                },
            ],
        ]);
    });

    it('expands a section to its eight child slots through the same source helper', () => {
        const state = {
            sections: {
                section_id: {
                    '1.1': 'node-1-1',
                } as Record<string, string>,
            },
        };
        const dispatch = vi.fn();
        const view = {
            documentStore: {
                getValue: () => state,
                dispatch,
            },
            getEffectiveMandalaSettings: () => ({
                view: {
                    coreSectionMax: 'unlimited',
                },
            }),
        };

        expect(ensureChildrenForSection(view as never, '1.1')).toBe('node-1-1');
        expect(dispatch).toHaveBeenCalledWith({
            type: 'document/mandala/ensure-children',
            payload: { parentNodeId: 'node-1-1', count: 8 },
        });
    });

    it('blocks sections beyond the configured core max', () => {
        const dispatch = vi.fn();
        const view = {
            documentStore: {
                getValue: () => ({
                    sections: {
                        section_id: {},
                    },
                }),
                dispatch,
            },
            getEffectiveMandalaSettings: () => ({
                view: {
                    coreSectionMax: 1,
                },
            }),
        };

        expect(ensureNodeForSection(view as never, '2.1')).toBeNull();
        expect(dispatch).not.toHaveBeenCalled();
        expect(noticeMock).toHaveBeenCalledWith('已达到你设定的范围上限。');
    });
});
