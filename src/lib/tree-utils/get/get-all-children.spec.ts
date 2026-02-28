import { describe, expect, it } from 'vitest';
import { getAllChildren } from 'src/lib/tree-utils/get/get-all-children';

const columns = [
    {
        id: 'c0',
        groups: [{ nodes: ['n1', 'n2', 'n3'], parentId: 'root' }],
    },
    {
        id: 'c1',
        groups: [
            { nodes: ['n1_1', 'n1_2'], parentId: 'n1' },
            { nodes: ['n2_1'], parentId: 'n2' },
        ],
    },
    {
        id: 'c2',
        groups: [{ nodes: ['n2_1_1'], parentId: 'n2_1' }],
    },
];

describe('getAllChildren', () => {
    it('case 1', () => {
        const children = getAllChildren(columns, 'n2');
        expect(children).toEqual(['n2_1', 'n2_1_1']);
    });
    it('case 2', () => {
        const children = getAllChildren(columns, 'n3');
        expect(children.length).toBe(0);
    });
});
