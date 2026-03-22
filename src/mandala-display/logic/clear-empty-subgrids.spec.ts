import { describe, expect, it } from 'vitest';
import { createClearEmptyMandalaSubgridsPlan } from 'src/mandala-display/logic/clear-empty-subgrids';

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
        const sections = {
            section_id: {
                '1': 'n117',
                '2': 'n2',
                '1.1': 'n1171',
                '1.2': 'n1172',
                '1.3': 'n1173',
                '1.4': 'n1174',
                '1.5': 'n1175',
                '1.6': 'n1176',
                '1.7': 'n1177',
                '1.8': 'n1178',
            },
            id_section: {
                n117: '1',
                n2: '2',
                n1171: '1.1',
                n1172: '1.2',
                n1173: '1.3',
                n1174: '1.4',
                n1175: '1.5',
                n1176: '1.6',
                n1177: '1.7',
                n1178: '1.8',
            },
        };

        const plan = createClearEmptyMandalaSubgridsPlan(document, sections);

        expect(plan.parentIds).toEqual(['n117']);
        expect(plan.rootNodeIds).toEqual([]);
        expect(plan.rootSections).toEqual([]);
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

    it('only removes trailing empty core sections and never deletes root 1', () => {
        const document = {
            columns: [
                {
                    id: 'c0',
                    groups: [{ parentId: 'root', nodes: ['n1', 'n2', 'n3'] }],
                },
            ],
            content: {
                n1: { content: '' },
                n2: { content: '' },
                n3: { content: 'keep' },
            },
        };
        const sections = {
            section_id: {
                '1': 'n1',
                '2': 'n2',
                '3': 'n3',
            },
            id_section: {
                n1: '1',
                n2: '2',
                n3: '3',
            },
        };

        const plan = createClearEmptyMandalaSubgridsPlan(document, sections);

        expect(plan.rootSections).toEqual([]);
        expect(plan.rootNodeIds).toEqual([]);
        expect(plan.nodesToRemove).toEqual([]);
    });
});
