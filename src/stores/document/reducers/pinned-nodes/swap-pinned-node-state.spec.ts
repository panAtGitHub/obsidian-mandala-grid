import { describe, expect, it } from 'vitest';
import { swapPinnedNodeState } from 'src/stores/document/reducers/pinned-nodes/swap-pinned-node-state';

describe('swapPinnedNodeState', () => {
    it('moves pin from source to target when only source is pinned', () => {
        const pinnedNodes = { Ids: ['a', 'x'] };
        swapPinnedNodeState(pinnedNodes, 'a', 'b');
        expect(pinnedNodes.Ids).toEqual(['b', 'x']);
    });

    it('moves pin from target to source when only target is pinned', () => {
        const pinnedNodes = { Ids: ['b', 'x'] };
        swapPinnedNodeState(pinnedNodes, 'a', 'b');
        expect(pinnedNodes.Ids).toEqual(['a', 'x']);
    });

    it('keeps pin set unchanged when both sides share same pin status', () => {
        const bothPinned = { Ids: ['a', 'b'] };
        swapPinnedNodeState(bothPinned, 'a', 'b');
        expect(bothPinned.Ids).toEqual(['a', 'b']);

        const nonePinned = { Ids: ['x'] };
        swapPinnedNodeState(nonePinned, 'a', 'b');
        expect(nonePinned.Ids).toEqual(['x']);
    });
});
