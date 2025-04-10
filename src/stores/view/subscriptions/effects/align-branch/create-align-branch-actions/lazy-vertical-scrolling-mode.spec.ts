import { describe, expect, test } from 'vitest';
import { lazyVerticalScrollingMode } from 'src/stores/view/subscriptions/effects/align-branch/create-align-branch-actions/lazy-vertical-scrolling-mode';
import { PluginAction } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';

describe('lazy vertical scrolling', () => {
    test('should not align parent when moving left', () => {
        // const n2 = 'nBBzDYZaD';
        // const n3 = 'nx3_ci_kX';
        // const n0 = 'rk1LyHnoM';
        // const c1 = 'c5SOvC488';
        const c2 = 'c2hxRIVJi';
        const c3 = 'cxym9-Tob';
        // const c4 = 'cdXjrMGq1';
        const n_1 = 'nBefxOMaM';
        const n1_1 = 'nixEcLX-z';
        const n1_1_1 = 'ncJjgXCQy';
        // const n1_1_1_1 = 'nPjS2fJCU';
        const context = {
            previousActiveBranch: {
                childGroups: new Set([n1_1_1]),
                sortedParentNodes: [n_1, n1_1],
                group: n1_1,
                column: c3,
                node: n1_1_1,
            },
            activeBranch: {
                childGroups: new Set([n1_1, n1_1_1]),
                sortedParentNodes: [n_1],
                group: n_1,
                column: c2,
                node: n1_1,
            },
        };

        /*   const columns = [
            {
                id: c1,
                groups: [
                    {
                        nodes: [n_1, n2, n3],
                        parentId: n0,
                    },
                ],
            },
            {
                id: c2,
                groups: [{ nodes: [n1_1], parentId: n_1 }],
            },
            {
                id: c3,
                groups: [{ nodes: [n1_1_1], parentId: n1_1 }],
            },
            {
                id: c4,
                groups: [{ nodes: [n1_1_1_1], parentId: n1_1_1 }],
            },
        ];*/
        const action = {
            type: 'view/set-active-node/keyboard',
            payload: {
                direction: 'left',
            },
            context: { outlineMode: false },
        } satisfies PluginAction;
        const output = [{ action: '20/active-node/vertical/reveal' }];
        const actual = lazyVerticalScrollingMode(context, action);
        expect(actual).toEqual(output);
    });
});
