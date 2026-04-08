import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exitThreeByThreeSubgrid } from 'src/mandala-scenes/view-3x3/subgrid-lifecycle';

const mocks = vi.hoisted(() => ({
    unloadNode: vi.fn(),
}));

describe('view-3x3/subgrid-lifecycle', () => {
    beforeEach(() => {
        mocks.unloadNode.mockReset();
    });

    it('flushes the active editor and prunes the current empty nested subgrid on exit', () => {
        const documentDispatch = vi.fn();
        const viewDispatch = vi.fn();
        const view = {
            mandalaMode: '3x3',
            inlineEditor: {
                unloadNode: mocks.unloadNode,
            },
            documentStore: {
                getValue: () => ({
                    sections: {
                        section_id: {
                            '1': 'node-1',
                            '1.2': 'node-1-2',
                            '1.2.1': 'node-1-2-1',
                            '1.2.2': 'node-1-2-2',
                            '1.2.3': 'node-1-2-3',
                            '1.2.4': 'node-1-2-4',
                            '1.2.5': 'node-1-2-5',
                            '1.2.6': 'node-1-2-6',
                            '1.2.7': 'node-1-2-7',
                            '1.2.8': 'node-1-2-8',
                        },
                    },
                    meta: {
                        mandalaV2: {
                            subtreeNonEmptyCountBySection: {},
                        },
                    },
                }),
                dispatch: documentDispatch,
            },
            viewStore: {
                getValue: () => ({
                    ui: {
                        mandala: {
                            subgridTheme: '1.2',
                        },
                    },
                    document: {
                        editing: {
                            activeNodeId: 'node-1-2-4',
                            isInSidebar: false,
                        },
                    },
                }),
                dispatch: viewDispatch,
            },
        };

        exitThreeByThreeSubgrid(view as never);

        expect(mocks.unloadNode).toHaveBeenCalledWith('node-1-2-4', false);
        expect(viewDispatch.mock.calls).toEqual([
            [{ type: 'view/editor/disable-main-editor' }],
            [
                {
                    type: 'view/mandala/subgrid/enter',
                    payload: { theme: '1' },
                },
            ],
            [
                {
                    type: 'view/set-active-node/mouse-silent',
                    payload: { id: 'node-1-2' },
                },
            ],
        ]);
        expect(documentDispatch).toHaveBeenCalledWith({
            type: 'document/mandala/clear-empty-subgrids',
            payload: {
                parentIds: ['node-1-2'],
                rootNodeIds: [],
                activeNodeId: 'node-1-2',
            },
        });
    });

    it('skips pruning when the current subgrid has content', () => {
        const documentDispatch = vi.fn();
        const viewDispatch = vi.fn();
        const view = {
            mandalaMode: '3x3',
            inlineEditor: {
                unloadNode: mocks.unloadNode,
            },
            documentStore: {
                getValue: () => ({
                    sections: {
                        section_id: {
                            '1': 'node-1',
                            '1.2': 'node-1-2',
                            '1.2.1': 'node-1-2-1',
                            '1.2.2': 'node-1-2-2',
                            '1.2.3': 'node-1-2-3',
                            '1.2.4': 'node-1-2-4',
                            '1.2.5': 'node-1-2-5',
                            '1.2.6': 'node-1-2-6',
                            '1.2.7': 'node-1-2-7',
                            '1.2.8': 'node-1-2-8',
                        },
                    },
                    meta: {
                        mandalaV2: {
                            subtreeNonEmptyCountBySection: {
                                '1.2.3': 1,
                            },
                        },
                    },
                }),
                dispatch: documentDispatch,
            },
            viewStore: {
                getValue: () => ({
                    ui: {
                        mandala: {
                            subgridTheme: '1.2',
                        },
                    },
                    document: {
                        editing: {
                            activeNodeId: '',
                            isInSidebar: false,
                        },
                    },
                }),
                dispatch: viewDispatch,
            },
        };

        exitThreeByThreeSubgrid(view as never);

        expect(documentDispatch).not.toHaveBeenCalled();
        expect(viewDispatch).toHaveBeenCalledWith({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: '1' },
        });
    });

    it('falls back to theme switching when the current theme is missing', () => {
        const documentDispatch = vi.fn();
        const viewDispatch = vi.fn();
        const view = {
            mandalaMode: '3x3',
            inlineEditor: {
                unloadNode: mocks.unloadNode,
            },
            documentStore: {
                getValue: () => ({
                    sections: {
                        section_id: {
                            '1': 'node-1',
                        },
                    },
                    meta: {
                        mandalaV2: {
                            subtreeNonEmptyCountBySection: {},
                        },
                    },
                }),
                dispatch: documentDispatch,
            },
            viewStore: {
                getValue: () => ({
                    ui: {
                        mandala: {
                            subgridTheme: '1.2',
                        },
                    },
                    document: {
                        editing: {
                            activeNodeId: '',
                            isInSidebar: false,
                        },
                    },
                }),
                dispatch: viewDispatch,
            },
        };

        exitThreeByThreeSubgrid(view as never);

        expect(documentDispatch).not.toHaveBeenCalled();
        expect(viewDispatch).toHaveBeenCalledWith({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: '1' },
        });
    });
});
