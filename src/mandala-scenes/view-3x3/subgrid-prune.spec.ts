import { describe, expect, it } from 'vitest';
import { createThreeByThreeSubgridPrunePlan } from 'src/mandala-scenes/view-3x3/subgrid-prune';

const toNodeId = (section: string): string =>
    `node-${section.split('.').join('-')}`;

const buildDocumentState = ({
    theme = '1.2',
    counts = {},
    childSlots = [1, 2, 3, 4, 5, 6, 7, 8],
}: {
    theme?: string;
    counts?: Record<string, number>;
    childSlots?: number[];
}) => {
    const section_id: Record<string, string> = {
        [theme]: toNodeId(theme),
    };

    for (const slot of childSlots) {
        section_id[`${theme}.${slot}`] = toNodeId(`${theme}.${slot}`);
    }

    return {
        sections: {
            section_id,
        },
        meta: {
            mandalaV2: {
                subtreeNonEmptyCountBySection: counts,
            },
        },
    } as never;
};

describe('view-3x3/subgrid-prune', () => {
    it('returns a prune plan for a fully materialized empty subgrid', () => {
        const plan = createThreeByThreeSubgridPrunePlan({
            theme: '1.2',
            documentState: buildDocumentState({}),
            activeNodeId: 'node-1-2',
        });

        expect(plan).toEqual({
            shouldPrune: true,
            parentIds: ['node-1-2'],
            activeNodeId: 'node-1-2',
        });
    });

    it('skips pruning when any direct child has content', () => {
        const plan = createThreeByThreeSubgridPrunePlan({
            theme: '1.2',
            documentState: buildDocumentState({
                counts: {
                    '1.2.4': 1,
                },
            }),
            activeNodeId: 'node-1-2',
        });

        expect(plan.shouldPrune).toBe(false);
    });

    it('skips pruning when a deeper descendant has content', () => {
        const plan = createThreeByThreeSubgridPrunePlan({
            theme: '1.2',
            documentState: buildDocumentState({
                counts: {
                    '1.2.3': 2,
                },
            }),
            activeNodeId: 'node-1-2',
        });

        expect(plan.shouldPrune).toBe(false);
    });

    it('skips pruning when the current theme is still sparse', () => {
        const plan = createThreeByThreeSubgridPrunePlan({
            theme: '1.2',
            documentState: buildDocumentState({
                childSlots: [1, 2, 3, 4],
            }),
            activeNodeId: 'node-1-2',
        });

        expect(plan.shouldPrune).toBe(false);
    });

    it('skips pruning when the current theme no longer exists', () => {
        const plan = createThreeByThreeSubgridPrunePlan({
            theme: '1.2',
            documentState: {
                sections: {
                    section_id: {},
                },
                meta: {
                    mandalaV2: {
                        subtreeNonEmptyCountBySection: {},
                    },
                },
            } as never,
            activeNodeId: 'node-1',
        });

        expect(plan).toEqual({
            shouldPrune: false,
            parentIds: [],
            activeNodeId: 'node-1',
        });
    });
});
