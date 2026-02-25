import { describe, expect, it } from 'vitest';
import { selectAllNodes } from 'src/stores/view/reducers/selection/select-all-nodes';
import { Column } from 'src/stores/document/document-state-type';
import { DocumentViewState } from 'src/stores/view/view-state-type';

describe('selectAllNodes', () => {
    it('should recover when active node is stale', () => {
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
        ];
        const state = {
            selectedNodes: new Set<string>(),
            activeNode: 'stale-node',
            activeBranch: {
                childGroups: new Set<string>(),
                sortedParentNodes: [],
                group: '',
                column: '',
                node: '',
            },
        } as unknown as DocumentViewState;

        expect(() => selectAllNodes(state, columns)).not.toThrow();
        expect(state.activeNode).toBe('n-1');
        expect(state.selectedNodes).toEqual(new Set(['n-1', 'n-2']));
    });
});
