import { describe, expect, test } from 'vitest';
import { getSearchResultsFromDocument } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/get-search-results-from-document';
import { calculateColumnTreeIndexes } from 'src/stores/view/subscriptions/helpers/calculate-tree-index';
import { clone } from 'src/helpers/clone';

describe('get-search-results-from-clipboard', () => {
    test('case: should host results up', () => {
        const results = [
            'nzaivYjBd',
            'nUZX85tNL',
            'nQ1InUZlU',
            'nhgPJz4xl',
            'nOra2kx1s',
            'nPXG7teAC',
        ];
        const c0 = 'cU0_vgoOD';
        const c1 = 'chpamZbhE';
        const c2 = 'cevCw14PI';
        const c3 = 'cbAt2m5R7';
        const root = 'rqjWyv6mB';
        const n1 = 'nzaivYjBd';
        const n1_1 = 'nUZX85tNL';
        const n1_2 = 'nmpoUKGgF';
        const n2 = 'nOvAL4zlz';
        const n2_1 = 'nQ1InUZlU';
        const n2_1_1 = 'nvvaurGox';
        const n2_1_1_1 = 'nhgPJz4xl';
        const n3 = 'nOra2kx1s';
        const n3_1 = 'nNXzP0TsC';
        const n3_2 = 'nPXG7teAC';
        const document = {
            columns: [
                { id: c0, groups: [{ nodes: [n1, n2, n3], parentId: root }] },
                {
                    id: c1,
                    groups: [
                        { nodes: [n1_1, n1_2], parentId: n1 },
                        { nodes: [n2_1], parentId: n2 },
                        { nodes: [n3_1, n3_2], parentId: n3 },
                    ],
                },
                { id: c2, groups: [{ nodes: [n2_1_1], parentId: n2_1 }] },
                { id: c3, groups: [{ nodes: [n2_1_1_1], parentId: n2_1_1 }] },
            ],
            content: {
                [n1]: { content: '#todo 1' },
                [n1_1]: { content: '#todo 1.1' },
                [n1_2]: { content: '#done 1.2' },
                [n2]: { content: '#done 2' },
                [n2_1]: { content: '#todo 2.1' },
                [n2_1_1]: { content: '#done 2.1.1' },
                [n2_1_1_1]: { content: '#todo 2.1.1.1' },
                [n3]: { content: '#todo 3' },
                [n3_1]: { content: '#done 3.1' },
                [n3_2]: { content: '#todo 3.2' },
            },
        };
        const output = `- #todo 1
\t- #done 1.2
- #todo 1.1
- #todo 2.1
\t- #done 2.1.1
- #todo 2.1.1.1
- #todo 3
\t- #done 3.1
- #todo 3.2`;
        const documentClone = clone(document);
        const actual = getSearchResultsFromDocument(
            results,
            document,
            calculateColumnTreeIndexes(document.columns),
        );
        expect(actual).toEqual(output);
        expect(document).toEqual(documentClone);
    });
});
