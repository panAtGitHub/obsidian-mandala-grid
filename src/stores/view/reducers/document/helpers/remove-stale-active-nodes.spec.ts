import { describe, expect, it } from 'vitest';
import { removeStaleActiveNodes } from 'src/stores/view/reducers/document/helpers/remove-stale-active-nodes';
import { Column } from 'src/mandala-document/state/document-state-type';
import { ActiveNodesOfColumn } from 'src/stores/view/view-state-type';

describe('removeStaleActiveNodes', () => {
    const sampleColumns: Column[] = [
        {
            id: 'col1',
            groups: [
                {
                    parentId: 'group1',
                    nodes: ['node1', 'node2', 'node3'],
                },
                {
                    parentId: 'group2',
                    nodes: ['node4', 'node5'],
                },
            ],
        },
        {
            id: 'col2',
            groups: [
                {
                    parentId: 'group3',
                    nodes: ['node6', 'node7'],
                },
            ],
        },
    ];

    it('should handle empty inputs', () => {
        expect(removeStaleActiveNodes([], {})).toEqual({});
        expect(removeStaleActiveNodes(sampleColumns, {})).toEqual({});
    });

    it('should remove stale columns', () => {
        const activeNodes: ActiveNodesOfColumn = {
            col1: {
                group1: 'node1',
            },
            staleColumn: {
                group1: 'node1',
            },
        };

        const expected: ActiveNodesOfColumn = {
            col1: {
                group1: 'node1',
            },
        };

        expect(removeStaleActiveNodes(sampleColumns, activeNodes)).toEqual(
            expected,
        );
    });

    it('should remove stale groups within valid columns', () => {
        const activeNodes: ActiveNodesOfColumn = {
            col1: {
                group1: 'node1',
                staleGroup: 'node1',
            },
        };

        const expected: ActiveNodesOfColumn = {
            col1: {
                group1: 'node1',
            },
        };

        expect(removeStaleActiveNodes(sampleColumns, activeNodes)).toEqual(
            expected,
        );
    });

    it('should remove stale node IDs within valid groups', () => {
        const activeNodes: ActiveNodesOfColumn = {
            col1: {
                group1: 'staleNode',
                group2: 'node4',
            },
        };

        const expected: ActiveNodesOfColumn = {
            col1: {
                group2: 'node4',
            },
        };

        expect(removeStaleActiveNodes(sampleColumns, activeNodes)).toEqual(
            expected,
        );
    });

    it('should handle multiple columns and groups correctly', () => {
        const activeNodes: ActiveNodesOfColumn = {
            col1: {
                group1: 'node2',
                group2: 'node4',
            },
            col2: {
                group3: 'node6',
            },
        };
        const expected: ActiveNodesOfColumn = {
            col1: {
                group1: 'node2',
                group2: 'node4',
            },
            col2: {
                group3: 'node6',
            },
        };

        expect(removeStaleActiveNodes(sampleColumns, activeNodes)).toEqual(
            expected,
        );
    });

    it('should remove empty columns after cleaning', () => {
        const activeNodes: ActiveNodesOfColumn = {
            col1: {
                staleGroup: 'node1',
            },
            col2: {
                group3: 'node6',
            },
        };

        const expected: ActiveNodesOfColumn = {
            col2: {
                group3: 'node6',
            },
        };

        expect(removeStaleActiveNodes(sampleColumns, activeNodes)).toEqual(
            expected,
        );
    });

    it('should handle complex nested cleanup scenarios', () => {
        const activeNodes: ActiveNodesOfColumn = {
            staleCol: {
                staleGroup: 'staleNode',
            },
            col1: {
                staleGroup: 'staleNode',
                group1: 'staleNode',
                group2: 'node4',
            },
            col2: {
                group3: 'node7',
                staleGroup: 'node6',
            },
        };

        const expected: ActiveNodesOfColumn = {
            col1: {
                group2: 'node4',
            },
            col2: {
                group3: 'node7',
            },
        };

        expect(removeStaleActiveNodes(sampleColumns, activeNodes)).toEqual(
            expected,
        );
    });
});
