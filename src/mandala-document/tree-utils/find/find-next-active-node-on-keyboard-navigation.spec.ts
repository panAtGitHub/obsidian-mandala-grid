import { describe, expect, it } from 'vitest';
import {
    findNextActiveNodeOnKeyboardNavigation,
    findNextActiveNodeOnKeyboardNavigation as findNext,
} from 'src/mandala-document/tree-utils/find/find-next-active-node-on-keyboard-navigation';
import { ActiveNodesOfColumn } from 'src/stores/view/view-state-type';

const c0 = 'cAKE';
const c1 = 'cNHU';
const c2 = 'ciZm';
const c3 = 'cl1A';
const root = 'rA2T';
const n1 = 'noXJ';
const n2 = 'nOeL';
const n3 = 'nEBY';
const n1_1 = 'nopT';
const n1_2 = 'nEvT';
const n2_1 = 'nzge';
const n2_2 = 'neRg';
const n3_1 = 'nw3f';
const n3_2 = 'n5zq';
const n1_1_1 = 'nCDp';
const n1_1_2 = 'nGL8';
const n1_2_1 = 'nBqE';
const n1_2_2 = 'nnWc';
const n2_1_1 = 'nMjS';
const n3_1_1 = 'nXq8';
const n3_1_2 = 'nocr';
const n3_2_1 = 'nLJ6';
const n3_2_2 = 'n-jb';
const n1_1_1_1 = 'nTUx';
// const n1_1_1_2 = 'ni1K';
const n1_1_2_1 = 'nNDD';
const n1_1_2_2 = 'nU36';
const n1_2_1_1 = 'nbx4';
const n1_2_1_2 = 'nG0c';
const n1_2_2_1 = 'ndA6';
const n1_2_2_2 = 'nqFX';
const n2_1_1_1 = 'nswJ';
const n2_1_1_2 = 'nafe';
const n3_1_1_1 = 'neWU';
const n3_1_1_2 = 'n9DE';
const n3_1_2_1 = 'nqae';
const n3_1_2_2 = 'njrh';
const n3_2_1_1 = 'ntpl';
const n3_2_1_2 = 'nxhi';
const n3_2_2_1 = 'nLCq';
const n3_2_2_2 = 'nAtq';
const input = {
    columns: [
        { id: c0, groups: [{ nodes: [n1, n2, n3], parentId: root }] },
        {
            id: c1,
            groups: [
                { nodes: [n1_1, n1_2], parentId: n1 },
                { nodes: [n2_1, n2_2], parentId: n2 },
                { nodes: [n3_1, n3_2], parentId: n3 },
            ],
        },
        {
            id: c2,
            groups: [
                { nodes: [n1_1_1, n1_1_2], parentId: n1_1 },
                { nodes: [n1_2_1, n1_2_2], parentId: n1_2 },
                { nodes: [n2_1_1], parentId: n2_1 },
                { nodes: [n3_1_1, n3_1_2], parentId: n3_1 },
                { nodes: [n3_2_1, n3_2_2], parentId: n3_2 },
            ],
        },
        {
            id: c3,
            groups: [
                { nodes: [n1_1_1_1], parentId: n1_1_1 },
                { nodes: [n1_1_2_1, n1_1_2_2], parentId: n1_1_2 },
                { nodes: [n1_2_1_1, n1_2_1_2], parentId: n1_2_1 },
                { nodes: [n1_2_2_1, n1_2_2_2], parentId: n1_2_2 },
                { nodes: [n2_1_1_1, n2_1_1_2], parentId: n2_1_1 },
                { nodes: [n3_1_1_1, n3_1_1_2], parentId: n3_1_1 },
                { nodes: [n3_1_2_1, n3_1_2_2], parentId: n3_1_2 },
                { nodes: [n3_2_1_1, n3_2_1_2], parentId: n3_2_1 },
                { nodes: [n3_2_2_1, n3_2_2_2], parentId: n3_2_2 },
            ],
        },
    ],
    state: {},
};
const gs: ActiveNodesOfColumn = {
    [c3]: {
        [n1_2_1]: n1_2_1_2,
        [n3_2_2]: n3_2_2_2,
    },
};
describe('find next active node after deletion', () => {
    it('1', () => {
        expect(findNext(input.columns, n1, 'up', gs, null)).toEqual(null);
        expect(findNext(input.columns, n1, 'left', gs, null)).toEqual(null);
        expect(findNext(input.columns, n1, 'down', gs, null)).toEqual(n2);
        expect(findNext(input.columns, n1, 'right', gs, null)).toEqual(n1_1);
    });
    it('2', () => {
        expect(findNext(input.columns, n2, 'up', gs, null)).toEqual(n1);
        expect(findNext(input.columns, n2, 'left', gs, null)).toEqual(null);
        expect(findNext(input.columns, n2, 'down', gs, null)).toEqual(n3);
        expect(findNext(input.columns, n2, 'right', gs, null)).toEqual(n2_1);
    });

    it('3', () => {
        expect(findNext(input.columns, n3, 'up', gs, null)).toEqual(n2);
        expect(findNext(input.columns, n3, 'left', gs, null)).toEqual(null);
        expect(findNext(input.columns, n3, 'down', gs, null)).toEqual(null);
        expect(findNext(input.columns, n3, 'right', gs, null)).toEqual(n3_1);
    });

    it('1.1', () => {
        expect(findNext(input.columns, n1_1, 'up', gs, null)).toEqual(null);
        expect(findNext(input.columns, n1_1, 'left', gs, null)).toEqual(n1);
        expect(findNext(input.columns, n1_1, 'down', gs, null)).toEqual(n1_2);
        expect(findNext(input.columns, n1_1, 'right', gs, null)).toEqual(
            n1_1_1,
        );
    });
    it('3.1', () => {
        expect(findNext(input.columns, n3_1, 'up', gs, null)).toEqual(n2_2);
        expect(findNext(input.columns, n3_1, 'left', gs, null)).toEqual(n3);
        expect(findNext(input.columns, n3_1, 'down', gs, null)).toEqual(n3_2);
        expect(findNext(input.columns, n3_1, 'right', gs, null)).toEqual(
            n3_1_1,
        );
    });

    it('1.1.1', () => {
        expect(findNext(input.columns, n1_1_1, 'up', gs, null)).toEqual(null);
        expect(findNext(input.columns, n1_1_1, 'left', gs, null)).toEqual(n1_1);
        expect(findNext(input.columns, n1_1_1, 'down', gs, null)).toEqual(
            n1_1_2,
        );
        expect(findNext(input.columns, n1_1_1, 'right', gs, null)).toEqual(
            n1_1_1_1,
        );
    });
    it('1.2.1', () => {
        expect(findNext(input.columns, n1_2_1, 'up', gs, null)).toEqual(n1_1_2);
        expect(findNext(input.columns, n1_2_1, 'left', gs, null)).toEqual(n1_2);
        expect(findNext(input.columns, n1_2_1, 'down', gs, null)).toEqual(
            n1_2_2,
        );
        expect(findNext(input.columns, n1_2_1, 'right', gs, null)).toEqual(
            n1_2_1_2,
        );
    });

    it('2.1.1', () => {
        expect(findNext(input.columns, n2_1_1, 'up', gs, null)).toEqual(n1_2_2);
        expect(findNext(input.columns, n2_1_1, 'left', gs, null)).toEqual(n2_1);
        expect(findNext(input.columns, n2_1_1, 'down', gs, null)).toEqual(
            n3_1_1,
        );
        expect(findNext(input.columns, n2_1_1, 'right', gs, null)).toEqual(
            n2_1_1_1,
        );
    });

    it('3.2.2', () => {
        expect(findNext(input.columns, n3_2_2, 'up', gs, null)).toEqual(n3_2_1);
        expect(findNext(input.columns, n3_2_2, 'left', gs, null)).toEqual(n3_2);
        expect(findNext(input.columns, n3_2_2, 'down', gs, null)).toEqual(null);
        expect(findNext(input.columns, n3_2_2, 'right', gs, null)).toEqual(
            n3_2_2_2,
        );
    });

    // resume here
    it('1.1.1.1', () => {
        expect(findNext(input.columns, n1_1_1_1, 'up', gs, null)).toEqual(null);
        expect(findNext(input.columns, n1_1_1_1, 'left', gs, null)).toEqual(
            n1_1_1,
        );
        expect(findNext(input.columns, n1_1_1_1, 'down', gs, null)).toEqual(
            n1_1_2_1,
        );
        expect(findNext(input.columns, n1_1_1_1, 'right', gs, null)).toEqual(
            null,
        );
    });

    it('3.1.2.1', () => {
        expect(findNext(input.columns, n3_1_2_1, 'up', gs, null)).toEqual(
            n3_1_1_2,
        );
        expect(findNext(input.columns, n3_1_2_1, 'left', gs, null)).toEqual(
            n3_1_2,
        );
        expect(findNext(input.columns, n3_1_2_1, 'down', gs, null)).toEqual(
            n3_1_2_2,
        );
        expect(findNext(input.columns, n3_1_2_1, 'right', gs, null)).toEqual(
            null,
        );
    });
    it('3.2.2.2', () => {
        expect(findNext(input.columns, n3_2_2_2, 'up', gs, null)).toEqual(
            n3_2_2_1,
        );
        expect(findNext(input.columns, n3_2_2_2, 'left', gs, null)).toEqual(
            n3_2_2,
        );
        expect(findNext(input.columns, n3_2_2_2, 'down', gs, null)).toEqual(
            null,
        );
        expect(findNext(input.columns, n3_2_2_2, 'right', gs, null)).toEqual(
            null,
        );
    });
});

describe('outline mode/up down', () => {
    const c0 = 'c0';
    const c1 = 'c1';
    const root = 'root';
    const n1 = 'n1';
    const n2 = 'n2';
    const n1_1 = 'n1_1';
    const n1_2 = 'n1_2';
    const n2_1 = 'n2_1';
    const document = {
        columns: [
            { id: c0, groups: [{ nodes: [n1, n2], parentId: root }] },
            {
                id: c1,
                groups: [
                    { nodes: [n1_1, n1_2], parentId: n1 },
                    { nodes: [n2_1], parentId: n2 },
                ],
            },
        ],
    };
    const activeNodeOfGroup = {
        cjpyfuL9U: { n1ZyHkTKt: 'nnOzP4kiW', 'ncasVHuo-': 'nuqAISMxY' },
    };
    it('should select parent when moving up and node is the first node of the group', () => {
        const input = {
            node: n2_1,
            direction: 'up',
            activeNodeOfGroup,
            collapsedParents: new Set<string>(),
        } as const;

        const actual = findNextActiveNodeOnKeyboardNavigation(
            document.columns,
            input.node,
            input.direction,
            input.activeNodeOfGroup,
            input.collapsedParents,
        );
        const output = n2;
        expect(actual).toEqual(output);
    });
    it('should select next parent when moving down and node is the last node of the group', () => {
        const input = {
            node: n1_2,
            direction: 'down',
            activeNodeOfGroup,
            collapsedParents: new Set<string>(),
        } as const;

        const actual = findNextActiveNodeOnKeyboardNavigation(
            document.columns,
            input.node,
            input.direction,
            input.activeNodeOfGroup,
            input.collapsedParents,
        );
        const output = n2;
        expect(actual).toEqual(output);
    });

    it('should not move up if node is the first in the entire document', () => {
        const input = {
            node: n1,
            direction: 'up',
            activeNodeOfGroup,
            collapsedParents: new Set<string>(),
        } as const;

        const actual = findNextActiveNodeOnKeyboardNavigation(
            document.columns,
            input.node,
            input.direction,
            input.activeNodeOfGroup,
            input.collapsedParents,
        );
        const output = null;
        expect(actual).toEqual(output);
    });

    it('should not move down if node is the last in the entire document', () => {
        const input = {
            node: n2,
            direction: 'down',
            activeNodeOfGroup,
            collapsedParents: new Set<string>(),
        } as const;

        const actual = findNextActiveNodeOnKeyboardNavigation(
            document.columns,
            input.node,
            input.direction,
            input.activeNodeOfGroup,
            input.collapsedParents,
        );
        const output = null;
        expect(actual).toEqual(output);
    });
});
