import { expect, test, vi } from 'vitest';
import { pasteNode } from 'src/stores/document/reducers/clipboard/paste-node/paste-node';
import { __id__ } from 'src/helpers/test-helpers/__id__';
import { text } from 'src/helpers/test-helpers/text';

const state = {
    n: 0,
    c: 0,
    s: 0,
};

vi.mock('src/helpers/id', () => {
    return {
        id: {
            rootNode: () => 'r-',
            node: () => 'n-' + state.n++,
            column: () => 'c-' + state.c++,
            snapshot: () => 's-' + state.s++,
        },
    };
});

test('paste node: pasted section number is not 1', () => {
    const c0 = 'c8nnpKMOX';
    const c1 = 'csrM-ZspE';
    const root = 'rKXCrYHpV';
    const n1 = 'nOPWxtPQA';
    const n1_1 = 'nghDOlIMr';
    const n1_2 = 'n2NjMIV68';
    const n3 = 'nMvLYXljJ';
    const n3_1 = 'nfpIPa8mn';
    const n3_2 = 'nVz9WcGG7';
    const n2 = __id__.node();
    const n2_1 = __id__.node();
    const n2_2 = __id__.node();
    const input = {
        columns: [
            { id: c0, groups: [{ nodes: [n1, n3], parentId: root }] },
            {
                id: c1,
                groups: [
                    { nodes: [n1_1, n1_2], parentId: n1 },
                    { nodes: [n3_1, n3_2], parentId: n3 },
                ],
            },
        ],
        content: {
            [n1]: { content: '1' },
            [n1_1]: { content: '1.1' },
            [n1_2]: { content: '1.2' },
            [n3]: { content: '3' },
            [n3_1]: { content: '3.1' },
            [n3_2]: { content: '3.2' },
        },
    };
    const action = {
        type: 'document/paste-node',
        payload: {
            targetNodeId: 'nOPWxtPQA',
            text: '<!--section: 2-->\n2\n\n<!--section: 2.1-->\n2.1\n\n<!--section: 2.2-->\n2.2',
        },
    };

    const output = {
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
        ],
        content: {
            [n1]: { content: '1' },
            [n1_1]: { content: '1.1' },
            [n1_2]: { content: '1.2' },
            [n3]: { content: '3' },
            [n3_1]: { content: '3.1' },
            [n3_2]: { content: '3.2' },
            [n2]: { content: '2' },
            [n2_1]: { content: '2.1' },
            [n2_2]: { content: '2.2' },
        },
    };
    pasteNode(input, action);
    expect(input.columns).toEqual(output.columns);
    expect(input.content).toEqual(output.content);
    expect(text(output)).toEqual(text(input));
});
