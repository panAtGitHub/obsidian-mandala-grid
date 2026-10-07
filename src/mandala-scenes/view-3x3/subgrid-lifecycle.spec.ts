import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    enterThreeByThreeSubgrid,
    exitThreeByThreeSubgrid,
} from 'src/mandala-scenes/view-3x3/subgrid-lifecycle';

const mocks = vi.hoisted(() => ({
    unloadNode: vi.fn(),
    ensureChildrenForSection: vi.fn(),
    notice: vi.fn(),
}));

vi.mock('src/mandala-interaction/helpers/ensure-node-for-section', () => ({
    ensureChildrenForSection: mocks.ensureChildrenForSection,
}));

vi.mock('obsidian', async (importOriginal) => ({
    ...(await importOriginal<typeof import('obsidian')>()),
    Notice: mocks.notice,
}));

describe('view-3x3/subgrid-lifecycle', () => {
    beforeEach(() => {
        mocks.unloadNode.mockReset();
        mocks.ensureChildrenForSection.mockReset();
        mocks.notice.mockReset();
    });

    it.each([true, false])(
        'allows existing next cores beyond a creation limit (exists: %s)',
        (exists) => {
            const dispatch = vi.fn();
            const view = {
                mandalaMode: '3x3',
                getEffectiveMandalaSettings: () => ({
                    view: { coreSectionMax: 1, subgridMaxDepth: 2 },
                }),
                getSectionLookup: () => ({ has: () => exists }),
                ensureFullHydrated: vi.fn(),
                documentStore: {
                    getValue: () => ({
                        meta: { isMandala: true },
                        file: { frontmatter: '' },
                        sections: {
                            id_section: { current: '261', next: '262' },
                            section_id: { '261': 'current', '262': 'next' },
                        },
                        document: {
                            content: { current: { content: '## 2026-09-18' } },
                        },
                    }),
                    dispatch: vi.fn(),
                },
                viewStore: {
                    getValue: () => ({
                        ui: { mandala: { subgridTheme: '261' } },
                    }),
                    dispatch,
                },
            };
            enterThreeByThreeSubgrid(view as never, 'current');
            if (exists) {
                expect(mocks.notice).not.toHaveBeenCalled();
                expect(dispatch).toHaveBeenCalledWith({
                    type: 'view/mandala/subgrid/enter',
                    payload: { theme: '262' },
                });
            } else {
                expect(mocks.notice).toHaveBeenCalledTimes(1);
                expect(dispatch).not.toHaveBeenCalled();
            }
        },
    );

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
