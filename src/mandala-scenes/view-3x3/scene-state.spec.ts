import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncThreeByThreeSubgridState } from 'src/mandala-scenes/view-3x3/scene-state';

const mocks = vi.hoisted(() => ({
    ensureChildrenForSection: vi.fn(),
    findChildGroup: vi.fn(),
}));

vi.mock('src/mandala-interaction/helpers/ensure-node-for-section', () => ({
    ensureChildrenForSection: mocks.ensureChildrenForSection,
}));

vi.mock('src/mandala-document/tree-utils/find/find-child-group', () => ({
    findChildGroup: mocks.findChildGroup,
}));

describe('syncThreeByThreeSubgridState', () => {
    beforeEach(() => {
        mocks.ensureChildrenForSection.mockReset();
        mocks.findChildGroup.mockReset();
    });

    it('materializes children for nested themes when the current subgrid is still sparse', () => {
        mocks.findChildGroup.mockReturnValue({
            nodes: ['a', 'b'],
        });
        const view = {
            getEffectiveMandalaSettings: () => ({
                view: {
                    subgridMaxDepth: 'unlimited',
                },
            }),
        };

        syncThreeByThreeSubgridState({
            view: view as never,
            mode: '3x3',
            subgridTheme: '1.1',
            documentState: {
                meta: { isMandala: true },
                document: {
                    columns: [],
                },
            } as never,
            sectionToNodeId: {
                '1.1': 'node-1-1',
            },
            allowSubgridExpansion: true,
        });

        expect(mocks.ensureChildrenForSection).toHaveBeenCalledWith(
            view,
            '1.1',
        );
    });

    it('skips materialization once a theme already has eight children', () => {
        mocks.findChildGroup.mockReturnValue({
            nodes: Array.from({ length: 8 }, (_, index) => `node-${index}`),
        });
        const view = {
            getEffectiveMandalaSettings: () => ({
                view: {
                    subgridMaxDepth: 'unlimited',
                },
            }),
        };

        syncThreeByThreeSubgridState({
            view: view as never,
            mode: '3x3',
            subgridTheme: '1.1',
            documentState: {
                meta: { isMandala: true },
                document: {
                    columns: [],
                },
            } as never,
            sectionToNodeId: {
                '1.1': 'node-1-1',
            },
            allowSubgridExpansion: true,
        });

        expect(mocks.ensureChildrenForSection).not.toHaveBeenCalled();
    });
});
