import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enterSubgridForNode } from 'src/mandala-interaction/helpers/mobile-navigation';

const mocks = vi.hoisted(() => ({
    notice: vi.fn(),
    ensureChildrenForSection: vi.fn(),
}));

vi.mock('obsidian', () => ({
    Notice: function Notice(message: string) {
        mocks.notice(message);
    },
}));

vi.mock('src/mandala-interaction/helpers/ensure-node-for-section', () => ({
    ensureChildrenForSection: mocks.ensureChildrenForSection,
}));

describe('mobile-navigation', () => {
    beforeEach(() => {
        mocks.notice.mockReset();
        mocks.ensureChildrenForSection.mockReset();
    });

    it('blocks entering a nested section that is already at the maximum visible depth', () => {
        const documentState = {
            meta: { isMandala: true },
            file: { frontmatter: '' },
            sections: {
                id_section: {
                    'node-1-2-2': '1.2.2',
                },
                section_id: {
                    '1.2.2': 'node-1-2-2',
                },
            },
            document: {
                content: {
                    'node-1-2-2': { content: 'filled' },
                },
            },
        };
        const viewDispatch = vi.fn();
        const view = {
            mandalaMode: '3x3',
            dayPlanHotCores: new Set<string>(),
            documentStore: {
                getValue: () => documentState,
                dispatch: vi.fn(),
            },
            viewStore: {
                dispatch: viewDispatch,
                getValue: () => ({
                    ui: {
                        mandala: {
                            subgridTheme: '1.2',
                        },
                    },
                }),
            },
            getEffectiveMandalaSettings: () => ({
                view: {
                    coreSectionMax: 'unlimited',
                    subgridMaxDepth: 3,
                },
                general: {
                    weekStart: 'monday',
                },
            }),
        };

        enterSubgridForNode(view as never, 'node-1-2-2');

        expect(mocks.notice).toHaveBeenCalledWith(
            '当前设置下已达到 3×3 子九宫层级上限。',
        );
        expect(viewDispatch).not.toHaveBeenCalled();
        expect(mocks.ensureChildrenForSection).not.toHaveBeenCalled();
    });

    it('still enters a section that can become a 3x3 center theme', () => {
        const documentState = {
            meta: { isMandala: true },
            file: { frontmatter: '' },
            sections: {
                id_section: {
                    'node-1-2': '1.2',
                },
                section_id: {
                    '1.2': 'node-1-2',
                },
            },
            document: {
                content: {
                    'node-1-2': { content: 'filled' },
                },
            },
        };
        const viewDispatch = vi.fn();
        const view = {
            mandalaMode: '3x3',
            dayPlanHotCores: new Set<string>(),
            documentStore: {
                getValue: () => documentState,
                dispatch: vi.fn(),
            },
            viewStore: {
                dispatch: viewDispatch,
                getValue: () => ({
                    ui: {
                        mandala: {
                            subgridTheme: '1',
                        },
                    },
                }),
            },
            getEffectiveMandalaSettings: () => ({
                view: {
                    coreSectionMax: 'unlimited',
                    subgridMaxDepth: 3,
                },
                general: {
                    weekStart: 'monday',
                },
            }),
        };

        enterSubgridForNode(view as never, 'node-1-2');

        expect(mocks.ensureChildrenForSection).toHaveBeenCalledWith(
            view,
            '1.2',
        );
        expect(viewDispatch.mock.calls).toEqual([
            [
                {
                    type: 'view/set-active-node/mouse-silent',
                    payload: { id: 'node-1-2' },
                },
            ],
            [
                {
                    type: 'view/mandala/subgrid/enter',
                    payload: { theme: '1.2' },
                },
            ],
        ]);
    });
});
