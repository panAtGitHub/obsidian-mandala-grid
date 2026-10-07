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
    it('loads visible indexed siblings after returning from native editing only once', () => {
        const materializeWorkingSet = vi.fn();
        const view = { materializeWorkingSet };
        const sectionToNodeId: Record<string, string> = {
            '280': 'core',
            '280.6': 'edited',
        };
        const args = {
            view: view as never,
            mode: '3x3',
            subgridTheme: '280',
            documentState: {} as never,
            sectionToNodeId,
            sectionLookup: {
                has: (section: string) =>
                    section === '280' || /^280\.[1-8]$/.test(section),
            } as never,
            allowSubgridExpansion: false,
        };

        syncThreeByThreeSubgridState(args);
        expect(materializeWorkingSet).toHaveBeenCalledWith('280');
        for (let slot = 1; slot <= 8; slot += 1) {
            sectionToNodeId[`280.${slot}`] = `node-${slot}`;
        }
        syncThreeByThreeSubgridState(args);
        expect(materializeWorkingSet).toHaveBeenCalledTimes(1);
        expect(mocks.ensureChildrenForSection).not.toHaveBeenCalled();
    });

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
                '1.1.1': 'node-1',
                '1.1.2': 'node-2',
                '1.1.3': 'node-3',
                '1.1.4': 'node-4',
                '1.1.5': 'node-5',
                '1.1.6': 'node-6',
                '1.1.7': 'node-7',
                '1.1.8': 'node-8',
            },
            allowSubgridExpansion: true,
        });

        expect(mocks.ensureChildrenForSection).not.toHaveBeenCalled();
    });

    it('repairs a subgrid when child nodes exist but section mappings are missing', () => {
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
                '1.1.1': 'node-1-1-1',
            },
            allowSubgridExpansion: true,
        });

        expect(mocks.ensureChildrenForSection).toHaveBeenCalledWith(
            view,
            '1.1',
        );
    });
});
