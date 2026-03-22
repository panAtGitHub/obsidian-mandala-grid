import { describe, expect, it } from 'vitest';
import {
    setMultipleNodeContent,
    setNodeContent,
} from 'src/mandala-document/state/reducers/content/set-node-content';
import { Content } from 'src/mandala-document/state/document-state-type';

describe('set-node-content', () => {
    it('should ignore update when node is stale', () => {
        const content: Content = {
            'n-1': { content: 'a' },
        };
        const changed = setNodeContent(content, {
            payload: {
                nodeId: 'missing-node',
                content: 'b',
            },
        });
        expect(changed).toBe(false);
        expect(content).toEqual({
            'n-1': { content: 'a' },
        });
    });

    it('should update existing node content', () => {
        const content: Content = {
            'n-1': { content: 'a' },
        };
        const changed = setNodeContent(content, {
            payload: {
                nodeId: 'n-1',
                content: 'b',
            },
        });
        expect(changed).toBe(true);
        expect(content['n-1'].content).toBe('b');
    });

    it('should skip stale nodes in batch update', () => {
        const content: Content = {
            'n-1': { content: 'a' },
            'n-2': { content: 'b' },
        };
        const changedNodeIds = setMultipleNodeContent(content, {
            payload: {
                updates: [
                    {
                        nodeId: 'missing-node',
                        content: 'x',
                    },
                    {
                        nodeId: 'n-2',
                        content: 'c',
                    },
                ],
            },
        });
        expect(changedNodeIds).toEqual(['n-2']);
        expect(content).toEqual({
            'n-1': { content: 'a' },
            'n-2': { content: 'c' },
        });
    });
});
