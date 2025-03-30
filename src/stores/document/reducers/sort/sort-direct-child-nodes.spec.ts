import { describe, expect, test } from 'vitest';
import { sortDirectChildNodes } from 'src/stores/document/reducers/sort/sort-direct-child-nodes';
import { LineageDocument } from 'src/stores/document/document-state-type';

describe('sort-direct-child-nodes', () => {
    test('case 1', () => {
        const c0 = 'c0';
        const c1 = 'c1';
        const c2 = 'c2';
        const c3 = 'c3';
        const root = 'root';
        const n1 = 'n1';
        const n2 = 'n2';
        const n3 = 'n3';
        const n1_1 = 'n1_1';
        const n1_1_1 = 'n1_1_1';
        const n1_2 = 'n1_2';
        const n1_2_1 = 'n1_2_1';
        const n1_2_2 = 'n1_2_2';
        const n2_1 = 'n2_1';
        const n2_2 = 'n2_2';
        const n2_3 = 'n2_3';
        const n2_1_1 = 'n2_1_1';
        const n2_1_2 = 'n2_1_2';
        const n2_2_1 = 'n2_2_1';
        const n2_2_1_1 = 'n2_2_1_1';
        const n2_3_1 = 'n2_3_1';
        const n2_3_2 = 'n2_3_2';
        const n3_1 = 'n3_1';
        const n3_2 = 'n3_2';
        const n3_2_1 = 'n3_2_1';
        const n3_2_1_1 = 'n3_2_1_1';
        const content = {
            [n1]: { content: '1' },
            [n2]: { content: '2' },
            [n3]: { content: '3' },
            [n1_1]: { content: '1.1' },
            [n1_1_1]: { content: '1.1.1' },
            [n1_2]: { content: '1.2' },
            [n1_2_1]: { content: '1.2.1' },
            [n1_2_2]: { content: '1.2.2' },
            [n2_1]: { content: '2.1' },
            [n2_2]: { content: '2.2' },
            [n2_3]: { content: '2.3' },
            [n2_1_1]: { content: '2.1.1' },
            [n2_1_2]: { content: '2.1.2' },
            [n2_2_1]: { content: '2.2.1' },
            [n2_2_1_1]: { content: '2.2.1.1' },
            [n2_3_1]: { content: '2.3.1' },
            [n2_3_2]: { content: '2.3.2' },
            [n3_1]: { content: '3.1' },
            [n3_2]: { content: '3.2' },
            [n3_2_1]: { content: '3.2.1' },
            [n3_2_1_1]: { content: '3.2.1.1' },
        };
        const payload = { id: n2, order: 'ascending' } as const;
        const input = {
            columns: [
                { id: c0, groups: [{ parentId: root, nodes: [n1, n2, n3] }] },
                {
                    id: c1,
                    groups: [
                        { nodes: [n1_1, n1_2], parentId: n1 },
                        // target group
                        { nodes: [n2_3, n2_1, n2_2], parentId: n2 },
                        { nodes: [n3_1, n3_2], parentId: n3 },
                    ],
                },
                {
                    id: c2,
                    groups: [
                        { nodes: [n1_1_1], parentId: n1_1 },
                        { nodes: [n1_2_1, n1_2_2], parentId: n1_2 },
                        { nodes: [n2_3_1, n2_3_2], parentId: n2_3 },
                        { nodes: [n2_1_1, n2_1_2], parentId: n2_1 },
                        { nodes: [n2_2_1], parentId: n2_2 },
                        { nodes: [n3_2_1], parentId: n3_2 },
                    ],
                },
                {
                    id: c3,
                    groups: [
                        { nodes: [n2_2_1_1], parentId: n2_2_1 },
                        { nodes: [n3_2_1_1], parentId: n3_2_1 },
                    ],
                },
            ],
            content: content,
        } satisfies LineageDocument;

        const output = {
            columns: [
                { id: c0, groups: [{ parentId: root, nodes: [n1, n2, n3] }] },
                {
                    id: c1,
                    groups: [
                        { nodes: [n1_1, n1_2], parentId: n1 },
                        { nodes: [n2_1, n2_2, n2_3], parentId: n2 },
                        { nodes: [n3_1, n3_2], parentId: n3 },
                    ],
                },
                {
                    id: c2,
                    groups: [
                        { nodes: [n1_1_1], parentId: n1_1 },
                        { nodes: [n1_2_1, n1_2_2], parentId: n1_2 },
                        { nodes: [n2_1_1, n2_1_2], parentId: n2_1 },
                        { nodes: [n2_2_1], parentId: n2_2 },
                        { nodes: [n2_3_1, n2_3_2], parentId: n2_3 },
                        { nodes: [n3_2_1], parentId: n3_2 },
                    ],
                },
                {
                    id: c3,
                    groups: [
                        { nodes: [n2_2_1_1], parentId: n2_2_1 },
                        { nodes: [n3_2_1_1], parentId: n3_2_1 },
                    ],
                },
            ],
            content: content,
        } satisfies LineageDocument;
        sortDirectChildNodes(input, payload);
        expect(input).toEqual(output);
    });
    test('case 2', () => {
        const c0 = 'c0';
        const c1 = 'c1';
        const c2 = 'c2';
        const c3 = 'c3';
        const c4 = 'c4';
        const c5 = 'c5';
        const root = 'root';
        const n1 = 'n1';
        const n1_1 = 'n1_1';
        const n1_1_1 = 'n1_1_1';
        const n1_1_1_1 = 'n1_1_1_1';
        const n1_1_2 = 'n1_1_2';
        const n1_2 = 'n1_2';
        const n1_2_1 = 'n1_2_1';
        const n1_2_1_1 = 'n1_2_1_1';
        const n1_2_1_1_1 = 'n1_2_1_1_1';
        const n1_2_2 = 'n1_2_2';
        const n1_2_3 = 'n1_2_3';
        const n1_2_3_1 = 'n1_2_3_1';
        const n1_2_3_2 = 'n1_2_3_2';
        const n1_2_3_3 = 'n1_2_3_3';
        const n1_2_4 = 'n1_2_4';
        const n1_2_4_1 = 'n1_2_4_1';
        const n1_2_4_1_1 = 'n1_2_4_1_1';
        const n1_2_4_1_1_1 = 'n1_2_4_1_1_1';
        const n2 = 'n2';
        const n2_2 = 'n2_2';
        const n2_2_1 = 'n2_2_1';
        const n2_2_1_1 = 'n2_2_1_1';
        const n2_2_1_2 = 'n2_2_1_2';
        const n2_2_1_2_1 = 'n2_2_1_2_1';
        const n2_2_1_2_2 = 'n2_2_1_2_2';
        const n2_2_1_3 = 'n2_2_1_3';
        const n2_2_2 = 'n2_2_2';
        const n2_2_2_1 = 'n2_2_2_1';
        const n2_2_2_2 = 'n2_2_2_2';
        const n2_2_2_3 = 'n2_2_2_3';
        const n2_3 = 'n2_3';
        const n2_3_1 = 'n2_3_1';
        const n2_3_2 = 'n2_3_2';
        const n2_3_3 = 'n2_3_3';
        const n2_3_3_1 = 'n2_3_3_1';
        const n2_3_3_2 = 'n2_3_3_2';
        const n2_3_3_3 = 'n2_3_3_3';
        const n2_3_3_3_1 = 'n2_3_3_3_1';
        const n2_3_3_3_2 = 'n2_3_3_3_2';
        const n2_3_3_3_3 = 'n2_3_3_3_3';
        const n2_3_3_3_4 = 'n2_3_3_3_4';
        const n2_3_3_3_4_1 = 'n2_3_3_3_4_1';
        const n2_1 = 'n2_1';
        const n2_1_1 = 'n2_1_1';
        const n2_1_2 = 'n2_1_2';
        const n2_1_3 = 'n2_1_3';
        const n2_1_4 = 'n2_1_4';
        const n2_1_4_1 = 'n2_1_4_1';
        const n2_1_4_1_1 = 'n2_1_4_1_1';
        const n3 = 'n3';
        const n3_1 = 'n3_1';
        const n3_2 = 'n3_2';
        const n3_3 = 'n3_3';
        const n3_3_1 = 'n3_3_1';
        const n3_3_1_1 = 'n3_3_1_1';
        const n3_3_1_2 = 'n3_3_1_2';
        const n3_3_1_3 = 'n3_3_1_3';
        const n3_3_1_3_1 = 'n3_3_1_3_1';
        const n3_3_2 = 'n3_3_2';
        const n3_3_2_1 = 'n3_3_2_1';
        const n3_3_2_1_1 = 'n3_3_2_1_1';
        const n3_3_2_1_1_1 = 'n3_3_2_1_1_1';
        const n3_3_2_2 = 'n3_3_2_2';
        const n3_3_2_2_1 = 'n3_3_2_2_1';
        const n3_3_3 = 'n3_3_3';
        const n3_3_3_1 = 'n3_3_3_1';
        const n3_3_3_1_1 = 'n3_3_3_1_1';
        const n3_3_3_1_2 = 'n3_3_3_1_2';
        const n3_3_3_2 = 'n3_3_3_2';
        const content = {
            [n1]: { content: '1' },
            [n1_1]: { content: '1.1' },
            [n1_1_1]: { content: '1.1.1' },
            [n1_1_1_1]: { content: '1.1.1.1' },
            [n1_1_2]: { content: '1.1.2' },
            [n1_2]: { content: '1.2' },
            [n1_2_1]: { content: '1.2.1' },
            [n1_2_1_1]: { content: '1.2.1.1' },
            [n1_2_1_1_1]: { content: '1.2.1.1.1' },
            [n1_2_2]: { content: '1.2.2' },
            [n1_2_3]: { content: '1.2.3' },
            [n1_2_3_1]: { content: '1.2.3.1' },
            [n1_2_3_2]: { content: '1.2.3.2' },
            [n1_2_3_3]: { content: '1.2.3.3' },
            [n1_2_4]: { content: '1.2.4' },
            [n1_2_4_1]: { content: '1.2.4.1' },
            [n1_2_4_1_1]: { content: '1.2.4.1.1' },
            [n1_2_4_1_1_1]: { content: '1.2.4.1.1.1' },
            [n2]: { content: '2' },
            [n2_2]: { content: '2.2' },
            [n2_2_1]: { content: '2.2.1' },
            [n2_2_1_1]: { content: '2.2.1.1' },
            [n2_2_1_2]: { content: '2.2.1.2' },
            [n2_2_1_2_1]: { content: '2.2.1.2.1' },
            [n2_2_1_2_2]: { content: '2.2.1.2.2' },
            [n2_2_1_3]: { content: '2.2.1.3' },
            [n2_2_2]: { content: '2.2.2' },
            [n2_2_2_1]: { content: '2.2.2.1' },
            [n2_2_2_2]: { content: '2.2.2.2' },
            [n2_2_2_3]: { content: '2.2.2.3' },
            [n2_3]: { content: '2.3' },
            [n2_3_1]: { content: '2.3.1' },
            [n2_3_2]: { content: '2.3.2' },
            [n2_3_3]: { content: '2.3.3' },
            [n2_3_3_1]: { content: '2.3.3.1' },
            [n2_3_3_2]: { content: '2.3.3.2' },
            [n2_3_3_3]: { content: '2.3.3.3' },
            [n2_3_3_3_1]: { content: '2.3.3.3.1' },
            [n2_3_3_3_2]: { content: '2.3.3.3.2' },
            [n2_3_3_3_3]: { content: '2.3.3.3.3' },
            [n2_3_3_3_4]: { content: '2.3.3.3.4' },
            [n2_3_3_3_4_1]: { content: '2.3.3.3.4.1' },
            [n2_1]: { content: '2.1' },
            [n2_1_1]: { content: '2.1.1' },
            [n2_1_2]: { content: '2.1.2' },
            [n2_1_3]: { content: '2.1.3' },
            [n2_1_4]: { content: '2.1.4' },
            [n2_1_4_1]: { content: '2.1.4.1' },
            [n2_1_4_1_1]: { content: '2.1.4.1.1' },
            [n3]: { content: '3' },
            [n3_1]: { content: '3.1' },
            [n3_2]: { content: '3.2' },
            [n3_3]: { content: '3.3' },
            [n3_3_1]: { content: '3.3.1' },
            [n3_3_1_1]: { content: '3.3.1.1' },
            [n3_3_1_2]: { content: '3.3.1.2' },
            [n3_3_1_3]: { content: '3.3.1.3' },
            [n3_3_1_3_1]: { content: '3.3.1.3.1' },
            [n3_3_2]: { content: '3.3.2' },
            [n3_3_2_1]: { content: '3.3.2.1' },
            [n3_3_2_1_1]: { content: '3.3.2.1.1' },
            [n3_3_2_1_1_1]: { content: '3.3.2.1.1.1' },
            [n3_3_2_2]: { content: '3.3.2.2' },
            [n3_3_2_2_1]: { content: '3.3.2.2.1' },
            [n3_3_3]: { content: '3.3.3' },
            [n3_3_3_1]: { content: '3.3.3.1' },
            [n3_3_3_1_1]: { content: '3.3.3.1.1' },
            [n3_3_3_1_2]: { content: '3.3.3.1.2' },
            [n3_3_3_2]: { content: '3.3.3.2' },
        };
        const payload = { id: n2, order: 'ascending' } as const;
        const input = {
            columns: [
                { id: c0, groups: [{ nodes: [n1, n2, n3], parentId: root }] },
                {
                    id: c1,
                    groups: [
                        { nodes: [n1_1, n1_2], parentId: n1 },
                        // target group
                        { nodes: [n2_2, n2_3, n2_1], parentId: n2 },
                        { nodes: [n3_1, n3_2, n3_3], parentId: n3 },
                    ],
                },
                {
                    id: c2,
                    groups: [
                        { nodes: [n1_1_1, n1_1_2], parentId: n1_1 },
                        {
                            nodes: [n1_2_1, n1_2_2, n1_2_3, n1_2_4],
                            parentId: n1_2,
                        },
                        { nodes: [n2_2_1, n2_2_2], parentId: n2_2 },
                        { nodes: [n2_3_1, n2_3_2, n2_3_3], parentId: n2_3 },
                        {
                            nodes: [n2_1_1, n2_1_2, n2_1_3, n2_1_4],
                            parentId: n2_1,
                        },
                        { nodes: [n3_3_1, n3_3_2, n3_3_3], parentId: n3_3 },
                    ],
                },
                {
                    id: c3,
                    groups: [
                        { nodes: [n1_1_1_1], parentId: n1_1_1 },
                        { nodes: [n1_2_1_1], parentId: n1_2_1 },
                        {
                            nodes: [n1_2_3_1, n1_2_3_2, n1_2_3_3],
                            parentId: n1_2_3,
                        },
                        { nodes: [n1_2_4_1], parentId: n1_2_4 },
                        {
                            nodes: [n2_2_1_1, n2_2_1_2, n2_2_1_3],
                            parentId: n2_2_1,
                        },
                        {
                            nodes: [n2_2_2_1, n2_2_2_2, n2_2_2_3],
                            parentId: n2_2_2,
                        },
                        {
                            nodes: [n2_3_3_1, n2_3_3_2, n2_3_3_3],
                            parentId: n2_3_3,
                        },
                        { nodes: [n2_1_4_1], parentId: n2_1_4 },
                        {
                            nodes: [n3_3_1_1, n3_3_1_2, n3_3_1_3],
                            parentId: n3_3_1,
                        },
                        { nodes: [n3_3_2_1, n3_3_2_2], parentId: n3_3_2 },
                        { nodes: [n3_3_3_1, n3_3_3_2], parentId: n3_3_3 },
                    ],
                },
                {
                    id: c4,
                    groups: [
                        { nodes: [n1_2_1_1_1], parentId: n1_2_1_1 },
                        { nodes: [n1_2_4_1_1], parentId: n1_2_4_1 },
                        { nodes: [n2_2_1_2_1, n2_2_1_2_2], parentId: n2_2_1_2 },
                        {
                            nodes: [
                                n2_3_3_3_1,
                                n2_3_3_3_2,
                                n2_3_3_3_3,
                                n2_3_3_3_4,
                            ],
                            parentId: n2_3_3_3,
                        },
                        { nodes: [n2_1_4_1_1], parentId: n2_1_4_1 },
                        { nodes: [n3_3_1_3_1], parentId: n3_3_1_3 },
                        { nodes: [n3_3_2_1_1], parentId: n3_3_2_1 },
                        { nodes: [n3_3_2_2_1], parentId: n3_3_2_2 },
                        { nodes: [n3_3_3_1_1, n3_3_3_1_2], parentId: n3_3_3_1 },
                    ],
                },
                {
                    id: c5,
                    groups: [
                        { nodes: [n1_2_4_1_1_1], parentId: n1_2_4_1_1 },
                        { nodes: [n2_3_3_3_4_1], parentId: n2_3_3_3_4 },
                        { nodes: [n3_3_2_1_1_1], parentId: n3_3_2_1_1 },
                    ],
                },
            ],
            content: content,
        };

        const output = {
            columns: [
                { id: c0, groups: [{ nodes: [n1, n2, n3], parentId: root }] },
                {
                    id: c1,
                    groups: [
                        { nodes: [n1_1, n1_2], parentId: n1 },
                        // target group
                        { nodes: [n2_1, n2_2, n2_3], parentId: n2 },
                        { nodes: [n3_1, n3_2, n3_3], parentId: n3 },
                    ],
                },
                {
                    id: c2,
                    groups: [
                        { nodes: [n1_1_1, n1_1_2], parentId: n1_1 },
                        {
                            nodes: [n1_2_1, n1_2_2, n1_2_3, n1_2_4],
                            parentId: n1_2,
                        },
                        {
                            nodes: [n2_1_1, n2_1_2, n2_1_3, n2_1_4],
                            parentId: n2_1,
                        },
                        { nodes: [n2_2_1, n2_2_2], parentId: n2_2 },
                        { nodes: [n2_3_1, n2_3_2, n2_3_3], parentId: n2_3 },
                        { nodes: [n3_3_1, n3_3_2, n3_3_3], parentId: n3_3 },
                    ],
                },
                {
                    id: c3,
                    groups: [
                        { nodes: [n1_1_1_1], parentId: n1_1_1 },
                        { nodes: [n1_2_1_1], parentId: n1_2_1 },
                        {
                            nodes: [n1_2_3_1, n1_2_3_2, n1_2_3_3],
                            parentId: n1_2_3,
                        },
                        { nodes: [n1_2_4_1], parentId: n1_2_4 },
                        { nodes: [n2_1_4_1], parentId: n2_1_4 },
                        {
                            nodes: [n2_2_1_1, n2_2_1_2, n2_2_1_3],
                            parentId: n2_2_1,
                        },
                        {
                            nodes: [n2_2_2_1, n2_2_2_2, n2_2_2_3],
                            parentId: n2_2_2,
                        },
                        {
                            nodes: [n2_3_3_1, n2_3_3_2, n2_3_3_3],
                            parentId: n2_3_3,
                        },
                        {
                            nodes: [n3_3_1_1, n3_3_1_2, n3_3_1_3],
                            parentId: n3_3_1,
                        },
                        { nodes: [n3_3_2_1, n3_3_2_2], parentId: n3_3_2 },
                        { nodes: [n3_3_3_1, n3_3_3_2], parentId: n3_3_3 },
                    ],
                },
                {
                    id: c4,
                    groups: [
                        { nodes: [n1_2_1_1_1], parentId: n1_2_1_1 },
                        { nodes: [n1_2_4_1_1], parentId: n1_2_4_1 },
                        { nodes: [n2_1_4_1_1], parentId: n2_1_4_1 },
                        { nodes: [n2_2_1_2_1, n2_2_1_2_2], parentId: n2_2_1_2 },
                        {
                            nodes: [
                                n2_3_3_3_1,
                                n2_3_3_3_2,
                                n2_3_3_3_3,
                                n2_3_3_3_4,
                            ],
                            parentId: n2_3_3_3,
                        },
                        { nodes: [n3_3_1_3_1], parentId: n3_3_1_3 },
                        { nodes: [n3_3_2_1_1], parentId: n3_3_2_1 },
                        { nodes: [n3_3_2_2_1], parentId: n3_3_2_2 },
                        { nodes: [n3_3_3_1_1, n3_3_3_1_2], parentId: n3_3_3_1 },
                    ],
                },
                {
                    id: c5,
                    groups: [
                        { nodes: [n1_2_4_1_1_1], parentId: n1_2_4_1_1 },
                        { nodes: [n2_3_3_3_4_1], parentId: n2_3_3_3_4 },
                        { nodes: [n3_3_2_1_1_1], parentId: n3_3_2_1_1 },
                    ],
                },
            ],
            content,
        };
        sortDirectChildNodes(input, payload);
        expect(input).toEqual(output);
    });
});
