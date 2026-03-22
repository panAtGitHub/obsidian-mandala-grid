import { describe, expect, it } from 'vitest';
import { Column } from 'src/mandala-document/state/document-state-type';
import { updateSelectedNodes } from 'src/stores/view/reducers/document/helpers/update-selected-nodes';

const c3 = 'c8zp';

const n2_1_1 = 'n2_1_1';
const a = 'a';
const b = 'b';
const n2_2_1 = 'n2_2_1';
const c = 'c';
const d = 'd';
const n2_2_2 = 'n2_2_2';
const e = 'e';
const f = 'f';
const n3_1_1 = 'n3_1_1';
const g = 'g';
const h = 'h';

const createColumn = (): Column => ({
    id: c3,
    groups: [
        // { nodes: [n1_1_1_1, n1_1_1_2], parentId: n1_1_1 },
        // { nodes: [n1_1_2_1, n1_1_2_2], parentId: n1_1_2 },
        // { nodes: [n1_2_1_1, n1_2_1_2], parentId: n1_2_1 },
        // { nodes: [n1_2_2_1, n1_2_2_2], parentId: n1_2_2 },
        { nodes: [a, b], parentId: n2_1_1 },
        { nodes: [c, d], parentId: n2_2_1 },
        { nodes: [e, f], parentId: n2_2_2 },
        { nodes: [g, h], parentId: n3_1_1 },
        // { nodes: [n3_1_2_1, n3_1_2_2], parentId: n3_1_2 },
        // { nodes: [n3_2_1_1, n3_2_1_2], parentId: n3_2_1 },
        // { nodes: [n3_2_2_1, n3_2_2_2], parentId: n3_2_2 },
    ],
});

describe('updateSelectedNodes', () => {
    it('from the middle, shift+up while no nodes is selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([]);
        updateSelectedNodes(column, selectedNodes, b, a);

        expect(selectedNodes).toEqual(new Set([a, b]));
    });

    it('from the top, shift+up while 3 nodes are selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([b, c, d]);
        updateSelectedNodes(column, selectedNodes, b, a);

        expect(selectedNodes).toEqual(new Set([a, b, c, d]));
    });

    it('from the top, shift+down while 3 nodes are selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([b, c, d]);
        updateSelectedNodes(column, selectedNodes, b, c);

        expect(selectedNodes).toEqual(new Set([c, d]));
    });

    it('from the bottom, shift+up while 3 nodes are selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([b, c, d]);
        updateSelectedNodes(column, selectedNodes, d, c);

        expect(selectedNodes).toEqual(new Set([b, c]));
    });
    it('from the bottom, shift+down while 3 nodes are selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([a, b, c]);
        updateSelectedNodes(column, selectedNodes, c, d);

        expect(selectedNodes).toEqual(new Set([a, b, c, d]));
    });
    it('from the bottom, shift+down while 3 nodes are selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([a, b, c]);
        updateSelectedNodes(column, selectedNodes, c, d);

        expect(selectedNodes).toEqual(new Set([a, b, c, d]));
    });

    it('from the top, shift+home while 3 nodes are selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([f, g, h]);
        updateSelectedNodes(column, selectedNodes, f, a);

        expect(selectedNodes).toEqual(new Set([a, b, c, d, e, f]));
    });

    it('from the top, shift+end while 3 nodes are selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([f, g, h]);
        updateSelectedNodes(column, selectedNodes, f, h);

        expect(selectedNodes).toEqual(new Set([f, g, h]));
    });
    it('from the bottom, shift+home while 3 nodes are selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([f, g, h]);
        updateSelectedNodes(column, selectedNodes, h, a);

        expect(selectedNodes).toEqual(new Set([a, b, c, d, e, f, g, h]));
    });

    it('from the bottom, shift+end while 3 nodes are selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([a, b, c]);
        updateSelectedNodes(column, selectedNodes, c, h);

        expect(selectedNodes).toEqual(new Set([c, d, e, f, g, h]));
    });

    it('from the top, shift+up while no node is selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([]);
        updateSelectedNodes(column, selectedNodes, b, a);

        expect(selectedNodes).toEqual(new Set([a, b]));
    });
    it('from the top, shift+down while no node is selected', () => {
        const column = createColumn();
        const selectedNodes = new Set<string>([]);
        updateSelectedNodes(column, selectedNodes, a, b);

        expect(selectedNodes).toEqual(new Set([a, b]));
    });
});
