import { describe, expect, it } from 'vitest';
import { createClearEmptyMandalaSubgridsPlan } from 'src/lib/mandala/clear-empty-subgrids';

describe('clear-empty-subgrids', () => {
    it('treats whitespace-only mandala cells as empty', () => {
        const document = {
            columns: [
                {
                    id: 'c0',
                    groups: [{ parentId: 'root', nodes: ['n117', 'n2'] }],
                },
                {
                    id: 'c1',
                    groups: [
                        {
                            parentId: 'n117',
                            nodes: [
                                'n1171',
                                'n1172',
                                'n1173',
                                'n1174',
                                'n1175',
                                'n1176',
                                'n1177',
                                'n1178',
                            ],
                        },
                    ],
                },
            ],
            content: {
                n117: { content: '\n' },
                n2: { content: 'keep root alive' },
                n1171: { content: '\n' },
                n1172: { content: '   ' },
                n1173: { content: '\n\n' },
                n1174: { content: '\t' },
                n1175: { content: '' },
                n1176: { content: ' \n ' },
                n1177: { content: '\r\n' },
                n1178: { content: '' },
            },
        };

        const plan = createClearEmptyMandalaSubgridsPlan(document);

        expect(plan.parentIds).toEqual(['n117']);
        expect(new Set(plan.nodesToRemove)).toEqual(
            new Set([
                'n1171',
                'n1172',
                'n1173',
                'n1174',
                'n1175',
                'n1176',
                'n1177',
                'n1178',
            ]),
        );
    });
});
