import { describe, expect, test } from 'vitest';
import { mapBranchesToText } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/map-branches-to-text';

describe('map active branches to text', () => {
    test('case 1', () => {
        const c0 = 'cBMJsmfqN';
        const c1 = 'cGlIzcEMV';
        const root = 'rx7YCJDZz';
        const n1 = 'ncWbPCYTj';
        const n1_1 = 'n_LYo0qIQ';
        const n1_2 = 'ntZPXOUCS';
        const n1_3 = 'nIBPQ3WT5';
        const n2 = 'nnqwbDRVw';
        const n2_1 = 'nIsR73fj2';
        const n2_2 = 'nPhlOry7b';
        const n2_3 = 'niRTlthrl';
        const n3 = 'nx1DQ1ehG';
        const n3_1 = 'nqYIXdY5Z';
        const n3_3 = 'noR6-zQx4';
        const n3_2 = 'nlaBV8GPP';
        const input = {
            columns: [
                { id: c0, groups: [{ nodes: [n1, n2, n3], parentId: root }] },
                {
                    id: c1,
                    groups: [
                        { nodes: [n1_1, n1_2, n1_3], parentId: n1 },
                        { nodes: [n2_1, n2_2, n2_3], parentId: n2 },
                        { nodes: [n3_1, n3_2, n3_3], parentId: n3 },
                    ],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n1_1]: { content: '1.1' },
                [n1_2]: { content: '1.2' },
                [n1_3]: { content: '1.3' },
                [n2]: { content: '2' },
                [n2_1]: { content: '2.1' },
                [n2_2]: { content: '2.2' },
                [n2_3]: { content: '2.3' },
                [n3]: { content: '3' },
                [n3_1]: { content: '3.1' },
                [n3_2]: { content: '3.2' },
                [n3_3]: { content: '3.3' },
            },
        };
        const sections = {
            id_section: {
                [n1]: '1',
                [n1_1]: '1.1',
                [n1_2]: '1.2',
                [n1_3]: '1.3',
                [n2]: '2',
                [n2_1]: '2.1',
                [n2_2]: '2.2',
                [n2_3]: '2.3',
                [n3]: '3',
                [n3_1]: '3.1',
                [n3_2]: '3.2',
                [n3_3]: '3.3',
            },
            section_id: {
                '1': n1,
                '1.1': n1_1,
                '1.2': n1_2,
                '1.3': n1_3,
                '2': n2,
                '2.1': n2_1,
                '2.2': n2_2,
                '2.3': n2_3,
                '3': n3,
                '3.1': n3_1,
                '3.2': n3_2,
                '3.3': n3_3,
            },
        };
        const action = {
            selectedNodes: new Set([n1, n2]),
            activeNode: n2,
        };
        const output = `<!--section: 1-->
1
<!--section: 1.1-->
1.1
<!--section: 1.2-->
1.2
<!--section: 1.3-->
1.3
<!--section: 2-->
2
<!--section: 2.1-->
2.1
<!--section: 2.2-->
2.2
<!--section: 2.3-->
2.3`;

        expect(
            mapBranchesToText(
                input,
                sections,
                action.selectedNodes.size > 0
                    ? Array.from(action.selectedNodes)
                    : [action.activeNode],
                'sections',
            ),
        ).toEqual(output);
    });
});
