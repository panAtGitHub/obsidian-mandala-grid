import { describe, expect, it } from 'vitest';
import {
    getFirstNodeId,
    isNodeAlive,
    resolveSafeActiveNode,
} from 'src/stores/view/reducers/document/helpers/active-node-safety';
import { Column } from 'src/stores/document/document-state-type';

const columns: Column[] = [
    {
        id: 'c-1',
        groups: [
            {
                parentId: 'root',
                nodes: ['n-1', 'n-2'],
            },
        ],
    },
    {
        id: 'c-2',
        groups: [
            {
                parentId: 'n-1',
                nodes: ['n-3'],
            },
        ],
    },
];

describe('active-node-safety', () => {
    it('isNodeAlive should return true only for nodes present in columns', () => {
        expect(isNodeAlive(columns, 'n-1')).toBe(true);
        expect(isNodeAlive(columns, 'missing')).toBe(false);
    });

    it('getFirstNodeId should return root fallback node id', () => {
        expect(getFirstNodeId(columns)).toBe('n-1');
        expect(getFirstNodeId([])).toBe('');
    });

    it('resolveSafeActiveNode should prioritize preferred, then current, then root', () => {
        expect(resolveSafeActiveNode(columns, 'n-3', 'n-2')).toBe('n-3');
        expect(resolveSafeActiveNode(columns, 'missing', 'n-2')).toBe('n-2');
        expect(resolveSafeActiveNode(columns, 'missing', 'also-missing')).toBe(
            'n-1',
        );
        expect(resolveSafeActiveNode([], 'missing', 'also-missing')).toBe('');
    });
});
