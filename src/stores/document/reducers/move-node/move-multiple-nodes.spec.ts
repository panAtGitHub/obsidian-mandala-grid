import { describe, expect, test } from 'vitest';
import { moveNode } from 'src/stores/document/reducers/move-node/move-node';

describe('move multiple nodes', () => {
    test('[(^n1 n2) n3], right', () => {
        const c0 = 'co3u_03TU';
        const root = 'rC8RgQ_CC';
        const n1 = 'n1';
        const n2 = 'n2';
        const n3 = 'n3';
        const input = {
            columns: [
                {
                    id: c0,
                    groups: [{ nodes: [n1, n2, n3], parentId: root }],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n2]: { content: '2' },
                [n3]: { content: '3' },
            },
        };
        const action = {
            type: 'document/move-node',
            payload: {
                direction: 'right',
                activeNodeId: 'n1',
                selectedNodes: new Set(['n1', 'n2']),
            },
        } as const;
        const c1 = 'c1';
        const output = {
            columns: [
                {
                    id: c0,
                    groups: [{ nodes: [n3], parentId: root }],
                },
                {
                    id: c1,
                    groups: [{ nodes: [n1, n2], parentId: n3 }],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n3]: { content: '3' },
                [n2]: { content: '2' },
            },
        };
        moveNode(input, action);
        input.columns[1].id = c1;
        expect(input.columns).toEqual(output.columns);
    });
    test('[n1 (n2 ^n3)], right', () => {
        const c0 = 'co3u_03TU';
        const root = 'rC8RgQ_CC';
        const n1 = 'n1';
        const n2 = 'n2';
        const n3 = 'n3';
        const input = {
            columns: [
                {
                    id: c0,
                    groups: [{ nodes: [n1, n2, n3], parentId: root }],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n2]: { content: '2' },
                [n3]: { content: '3' },
            },
        };
        const action = {
            type: 'document/move-node',
            payload: {
                direction: 'right',
                activeNodeId: 'n3',
                selectedNodes: new Set(['n2', 'n3']),
            },
        } as const;
        const c1 = 'c1';
        const output = {
            columns: [
                {
                    id: c0,
                    groups: [{ nodes: [n1], parentId: root }],
                },
                {
                    id: c1,
                    groups: [{ nodes: [n2, n3], parentId: n1 }],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n3]: { content: '3' },
                [n2]: { content: '2' },
            },
        };
        moveNode(input, action);
        input.columns[1].id = c1;
        expect(input.columns).toEqual(output.columns);
    });
    test('[n1 (n2 ^n3)], up', () => {
        const c0 = 'cFVK8gSO-';
        const root = 'rrTuXoUU9';
        const n1 = 'n1';
        const n2 = 'n2';
        const n3 = 'n3';
        const input = {
            columns: [
                { id: c0, groups: [{ nodes: [n1, n2, n3], parentId: root }] },
            ],
            content: {
                [n1]: { content: '1' },
                [n2]: { content: '2' },
                [n3]: { content: '3' },
            },
        };
        const action = {
            type: 'document/move-node',
            payload: {
                direction: 'up',
                activeNodeId: n3,
                selectedNodes: new Set([n2, n3]),
            },
        } as const;

        const output = {
            columns: [
                { id: c0, groups: [{ nodes: [n2, n3, n1], parentId: root }] },
            ],
            content: {
                [n1]: { content: '1' },
                [n2]: { content: '2' },
                [n3]: { content: '3' },
            },
        };
        moveNode(input, action);
        expect(input.columns).toEqual(output.columns);
    });
    test('[(n1 ^n2) n3], down', () => {
        const c0 = 'cFVK8gSO-';
        const root = 'rrTuXoUU9';
        const n1 = 'n1';
        const n2 = 'n2';
        const n3 = 'n3';
        const input = {
            columns: [
                { id: c0, groups: [{ nodes: [n1, n2, n3], parentId: root }] },
            ],
            content: {
                [n1]: { content: '1' },
                [n2]: { content: '2' },
                [n3]: { content: '3' },
            },
        };
        const action = {
            type: 'document/move-node',
            payload: {
                direction: 'down',
                activeNodeId: n2,
                selectedNodes: new Set([n1, n2]),
            },
        } as const;

        const output = {
            columns: [
                { id: c0, groups: [{ nodes: [n3, n1, n2], parentId: root }] },
            ],
            content: {
                [n1]: { content: '1' },
                [n2]: { content: '2' },
                [n3]: { content: '3' },
            },
        };
        moveNode(input, action);
        expect(input.columns).toEqual(output.columns);
    });

    test('[n1] [n1_1 (^n1_2 n1_3)], up', () => {
        const c0 = 'cZ0go1upA';
        const c1 = 'c2A650zBo';
        const root = 'roAPrvw2q';
        const n1 = 'n1';
        const n1_1 = 'n1_1';
        const n1_2 = 'n1_2';
        const n1_3 = 'n1_3';
        const input = {
            columns: [
                { id: c0, groups: [{ nodes: [n1], parentId: root }] },
                {
                    id: c1,
                    groups: [{ nodes: [n1_1, n1_2, n1_3], parentId: n1 }],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n1_2]: { content: '1.2' },
                [n1_1]: { content: '1.1' },
                [n1_3]: { content: '1.3' },
            },
        };
        const action = {
            type: 'document/move-node',
            payload: {
                direction: 'up',
                activeNodeId: 'n1_2',
                selectedNodes: new Set(['n1_2', 'n1_3']),
            },
        } as const;

        const output = {
            columns: [
                { id: c0, groups: [{ nodes: [n1], parentId: root }] },
                {
                    id: c1,
                    groups: [{ nodes: [n1_2, n1_3, n1_1], parentId: n1 }],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n1_2]: { content: '1.2' },
                [n1_1]: { content: '1.1' },
                [n1_3]: { content: '1.3' },
            },
        };
        moveNode(input, action);
        expect(input.columns).toEqual(output.columns);
    });
    test('[n1] [n1_1 (^n1_2 n1_3)] left', () => {
        const c0 = 'cZ0go1upA';
        const c1 = 'c2A650zBo';
        const root = 'roAPrvw2q';
        const n1 = 'n1';
        const n1_1 = 'n1_1';
        const n1_2 = 'n1_2';
        const n1_3 = 'n1_3';
        const input = {
            columns: [
                { id: c0, groups: [{ nodes: [n1], parentId: root }] },
                {
                    id: c1,
                    groups: [{ nodes: [n1_1, n1_2, n1_3], parentId: n1 }],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n1_2]: { content: '1.2' },
                [n1_1]: { content: '1.1' },
                [n1_3]: { content: '1.3' },
            },
        };
        const action = {
            type: 'document/move-node',
            payload: {
                direction: 'left',
                activeNodeId: 'n1_2',
                selectedNodes: new Set(['n1_2', 'n1_3']),
            },
        } as const;

        const output = {
            columns: [
                {
                    id: c0,
                    groups: [{ nodes: [n1, n1_2, n1_3], parentId: root }],
                },
                {
                    id: c1,
                    groups: [{ nodes: [n1_1], parentId: n1 }],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n1_2]: { content: '1.2' },
                [n1_1]: { content: '1.1' },
                [n1_3]: { content: '1.3' },
            },
        };
        moveNode(input, action);
        expect(input.columns).toEqual(output.columns);
    });

    test('[n1 (^n2 n3)] [n1_1 n1_2 n1_3 n2_1 n2_2 n2_3 n3_1 n3_2 n3_3], up', () => {
        const c0 = 'cCtcqaxH3';
        const c1 = 'cBENnXT0s';
        const root = 'rY8aj2x66';
        const n1 = 'nzMxWYubU';
        const n1_2 = 'nI2Qd3qZN';
        const n1_3 = 'nkxLWRuAz';
        const n1_1 = 'nrhcuFd_c';
        const n2 = 'ncaSV5poL';
        const n2_1 = 'nw5CViFkX';
        const n2_2 = 'n69p5PLi5';
        const n2_3 = 'n2YhpCC37';
        const n3 = 'ntSGTbx0t';
        const n3_1 = 'nu1Fcb4OM';
        const n3_2 = 'ndhyhygAZ';
        const n3_3 = 'nQS-zZ2EB';
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
                [n1_2]: { content: '1.2' },
                [n1_3]: { content: '1.3' },
                [n1_1]: { content: '1.1' },
                [n2]: { content: '2' },
                [n2_1]: { content: '2.1' },
                [n2_2]: { content: '2.2' },
                [n2_3]: { content: '2.3' },
                [n3]: { content: '3' },
                [n3_1]: { content: '3.1' },
                [n3_3]: { content: '3.3' },
                [n3_2]: { content: '3.2' },
            },
        };
        const action = {
            type: 'document/move-node',
            payload: {
                direction: 'up',
                activeNodeId: n2,
                selectedNodes: new Set([n2, n3]),
            },
        } as const;

        const output = {
            columns: [
                { id: c0, groups: [{ nodes: [n2, n3, n1], parentId: root }] },
                {
                    id: c1,
                    groups: [
                        { nodes: [n2_1, n2_2, n2_3], parentId: n2 },
                        { nodes: [n3_1, n3_2, n3_3], parentId: n3 },
                        { nodes: [n1_1, n1_2, n1_3], parentId: n1 },
                    ],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n1_2]: { content: '1.2' },
                [n1_3]: { content: '1.3' },
                [n1_1]: { content: '1.1' },
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
        moveNode(input, action);
        expect(input.columns).toEqual(output.columns);
    });

    test('[(^n1 n2) n3] [n1_1 n1_2 n1_3 n2_1 n2_2 n2_3 n3_1 n3_2 n3_3], down', () => {
        const c0 = 'cCtcqaxH3';
        const c1 = 'cBENnXT0s';
        const root = 'rY8aj2x66';
        const n1 = 'nzMxWYubU';
        const n1_2 = 'nI2Qd3qZN';
        const n1_3 = 'nkxLWRuAz';
        const n1_1 = 'nrhcuFd_c';
        const n2 = 'ncaSV5poL';
        const n2_1 = 'nw5CViFkX';
        const n2_2 = 'n69p5PLi5';
        const n2_3 = 'n2YhpCC37';
        const n3 = 'ntSGTbx0t';
        const n3_1 = 'nu1Fcb4OM';
        const n3_3 = 'nQS-zZ2EB';
        const n3_2 = 'n3_2';
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
                [n1_2]: { content: '1.2' },
                [n1_3]: { content: '1.3' },
                [n1_1]: { content: '1.1' },
                [n2]: { content: '2' },
                [n2_1]: { content: '2.1' },
                [n2_2]: { content: '2.2' },
                [n2_3]: { content: '2.3' },
                [n3]: { content: '3' },
                [n3_1]: { content: '3.1' },
                [n3_3]: { content: '3.2' },
            },
        };
        const action = {
            type: 'document/move-node',
            payload: {
                direction: 'down',
                activeNodeId: n1,
                selectedNodes: new Set([n1, n2]),
            },
        } as const;

        const output = {
            columns: [
                { id: c0, groups: [{ nodes: [n3, n1, n2], parentId: root }] },
                {
                    id: c1,
                    groups: [
                        { nodes: [n3_1, n3_2, n3_3], parentId: n3 },
                        { nodes: [n1_1, n1_2, n1_3], parentId: n1 },
                        { nodes: [n2_1, n2_2, n2_3], parentId: n2 },
                    ],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n1_2]: { content: '1.2' },
                [n1_3]: { content: '1.3' },
                [n1_1]: { content: '1.1' },
                [n2]: { content: '2' },
                [n2_1]: { content: '2.1' },
                [n2_2]: { content: '2.2' },
                [n2_3]: { content: '2.3' },
                [n3]: { content: '3' },
                [n3_1]: { content: '3.1' },
                [n3_3]: { content: '3.2' },
            },
        };
        moveNode(input, action);
        expect(input.columns).toEqual(output.columns);
    });

    test('[(^n1 n2) n3] [n1_1 n1_2 n1_3 n2_1 n2_2 n2_3 n3_1 n3_2 n3_3], right', () => {
        const c0 = 'cCtcqaxH3';
        const c1 = 'cBENnXT0s';
        const root = 'rY8aj2x66';
        const n1 = 'nzMxWYubU';
        const n1_2 = 'nI2Qd3qZN';
        const n1_3 = 'nkxLWRuAz';
        const n1_1 = 'nrhcuFd_c';
        const n2 = 'ncaSV5poL';
        const n2_1 = 'nw5CViFkX';
        const n2_2 = 'n69p5PLi5';
        const n2_3 = 'n2YhpCC37';
        const n3 = 'ntSGTbx0t';
        const n3_1 = 'nu1Fcb4OM';
        const n3_3 = 'nQS-zZ2EB';
        const n3_2 = 'nju8dhaZd';
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
                [n1_2]: { content: '1.2' },
                [n1_3]: { content: '1.3' },
                [n1_1]: { content: '1.1' },
                [n2]: { content: '2' },
                [n2_1]: { content: '2.1' },
                [n2_2]: { content: '2.2' },
                [n2_3]: { content: '2.3' },
                [n3]: { content: '3' },
                [n3_1]: { content: '3.1' },
                [n3_3]: { content: '3.3' },
                [n3_2]: { content: '3.2' },
            },
        };
        const action = {
            type: 'document/move-node',
            payload: {
                direction: 'right',
                activeNodeId: n1,
                selectedNodes: new Set([n1, n2]),
            },
        } as const;
        const c2 = 'c2';
        const output = {
            columns: [
                { id: c0, groups: [{ nodes: [n3], parentId: root }] },
                {
                    id: c1,
                    groups: [
                        {
                            nodes: [n3_1, n3_2, n3_3, n1, n2],
                            parentId: n3,
                        },
                    ],
                },
                {
                    id: c2,
                    groups: [
                        { nodes: [n1_1, n1_2, n1_3], parentId: n1 },
                        { nodes: [n2_1, n2_2, n2_3], parentId: n2 },
                    ],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n1_2]: { content: '1.2' },
                [n1_3]: { content: '1.3' },
                [n1_1]: { content: '1.1' },
                [n2]: { content: '2' },
                [n2_1]: { content: '2.1' },
                [n2_2]: { content: '2.2' },
                [n2_3]: { content: '2.3' },
                [n3]: { content: '3' },
                [n3_1]: { content: '3.1' },
                [n3_3]: { content: '3.3' },
                [n3_2]: { content: '3.2' },
            },
        };
        moveNode(input, action);
        input.columns[2].id = c2;
        expect(input.columns).toEqual(output.columns);
    });

    test('... left', () => {
        const c0 = 'cCtcqaxH3';
        const c1 = 'cBENnXT0s';
        const c2 = 'crRrYCumT';
        const root = 'rY8aj2x66';
        const n1 = 'nzMxWYubU';
        const n1_2 = 'nI2Qd3qZN';
        const n1_3 = 'nkxLWRuAz';
        const n1_1 = 'nrhcuFd_c';
        const n2 = 'ncaSV5poL';
        const n2_1 = 'nw5CViFkX';
        const n2_2 = 'n69p5PLi5';
        const n2_3 = 'n2YhpCC37';
        const n3 = 'ntSGTbx0t';
        const n3_1 = 'nu1Fcb4OM';
        const n3_3 = 'nQS-zZ2EB';
        const n3_2 = 'nyZw-Um7-';
        const input = {
            columns: [
                { id: c0, groups: [{ nodes: [n3], parentId: root }] },
                {
                    id: c1,
                    groups: [
                        {
                            nodes: [n3_1, n3_2, n3_3, n1, n2],
                            parentId: n3,
                        },
                    ],
                },
                {
                    id: c2,
                    groups: [
                        { nodes: [n1_1, n1_2, n1_3], parentId: n1 },
                        { nodes: [n2_1, n2_2, n2_3], parentId: n2 },
                    ],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n1_2]: { content: '1.2' },
                [n1_3]: { content: '1.3' },
                [n1_1]: { content: '1.1' },
                [n2]: { content: '2' },
                [n2_1]: { content: '2.1' },
                [n2_2]: { content: '2.2' },
                [n2_3]: { content: '2.3' },
                [n3]: { content: '3' },
                [n3_1]: { content: '3.1' },
                [n3_3]: { content: '3.3' },
            },
        };
        const action = {
            type: 'document/move-node',
            payload: {
                direction: 'left',
                activeNodeId: 'ncaSV5poL',
                selectedNodes: new Set(['nzMxWYubU', 'ncaSV5poL']),
            },
        } as const;

        const output = {
            columns: [
                { id: c0, groups: [{ nodes: [n3, n1, n2], parentId: root }] },
                {
                    id: c1,
                    groups: [
                        { nodes: [n3_1, n3_2, n3_3], parentId: n3 },
                        { nodes: [n1_1, n1_2, n1_3], parentId: n1 },
                        { nodes: [n2_1, n2_2, n2_3], parentId: n2 },
                    ],
                },
            ],
            content: {
                [n1]: { content: '1' },
                [n1_2]: { content: '1.2' },
                [n1_3]: { content: '1.3' },
                [n1_1]: { content: '1.1' },
                [n2]: { content: '2' },
                [n2_1]: { content: '2.1' },
                [n2_2]: { content: '2.2' },
                [n2_3]: { content: '2.3' },
                [n3]: { content: '3' },
                [n3_1]: { content: '3.1' },
                [n3_3]: { content: '3.3' },
            },
        };
        moveNode(input, action);
        expect(input.columns).toEqual(output.columns);
    });
});
