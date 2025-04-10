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

test('paste node: order of root nodes', () => {
    const c0 = 'czgXsqXRh';
    const c1 = 'c-2';
    const root = 'rGMuzFrTg';
    const n = 'nNV0rOET2';
    const n1 = __id__.node();
    const n1_1 = __id__.node();
    const n1_2 = __id__.node();
    const n2 = __id__.node();
    const n2_1 = __id__.node();
    const n2_2 = __id__.node();
    const n3 = __id__.node();
    const n3_1 = __id__.node();
    const n3_2 = __id__.node();
    const input = {
        columns: [{ id: c0, groups: [{ nodes: [n], parentId: root }] }],
        content: { [n]: { content: '' } },
    };
    const action = {
        type: 'document/paste-node',
        payload: {
            targetNodeId: 'nNV0rOET2',
            text: '\n<!--section: 2-->\n1\n\n<!--section: 2.1-->\n1.1\n\n<!--section: 2.2-->\n1.2\n\n<!--section: 3-->\n2\n\n<!--section: 3.1-->\n2.1\n\n<!--section: 3.2-->\n2.2\n\n<!--section: 4-->\n3\n\n<!--section: 4.1-->\n3.1\n\n<!--section: 4.2-->\n3.2',
        },
    };

    const output = {
        columns: [
            { id: c0, groups: [{ nodes: [n, n1, n2, n3], parentId: root }] },
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
            [n]: { content: '' },
            [n3]: { content: '3' },
            [n3_1]: { content: '3.1' },
            [n3_2]: { content: '3.2' },
            [n2]: { content: '2' },
            [n2_1]: { content: '2.1' },
            [n2_2]: { content: '2.2' },
            [n1]: { content: '1' },
            [n1_1]: { content: '1.1' },
            [n1_2]: { content: '1.2' },
        },
    };

    pasteNode(input, action);
    expect(input.columns).toEqual(output.columns);
    expect(input.content).toEqual(output.content);
    expect(text(output)).toEqual(text(input));
});
