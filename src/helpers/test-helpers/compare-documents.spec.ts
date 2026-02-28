import { describe, expect, test } from 'vitest';
import { compareDocuments } from 'src/helpers/test-helpers/compare-documents';
import { clone } from 'src/helpers/clone';
import { MandalaGridDocument } from 'src/stores/document/document-state-type';
import invariant from 'tiny-invariant';

const createDocument = (): MandalaGridDocument => ({
    columns: [
        {
            id: 'c0',
            groups: [{ nodes: ['n1', 'n2'], parentId: 'root' }],
        },
        {
            id: 'c1',
            groups: [{ nodes: ['n1_1', 'n1_2'], parentId: 'n1' }],
        },
    ],
    content: {
        n1: { content: 'Root 1' },
        n2: { content: 'Root 2' },
        n1_1: { content: 'Child 1' },
        n1_2: { content: 'Child 2' },
    },
});

describe('compare documents', () => {
    test('should be equal', () => {
        const document = createDocument();
        expect(compareDocuments(document, document)).toBe(true);
    });

    test('should not be equal: content', () => {
        const docA = createDocument();
        const docB: MandalaGridDocument = clone(docA);
        const firstNode = docB.columns[0].groups[0].nodes[0];
        invariant(docB.content[firstNode]);
        docB.content[firstNode].content = String(Math.random());
        expect(compareDocuments(docA, docB)).toBe(false);
    });

    test('should not be equal: columns', () => {
        const docA = createDocument();
        const docB: MandalaGridDocument = clone(docA);

        docB.columns.pop();
        expect(compareDocuments(docA, docB)).toBe(false);
    });
    test('should not be equal: groups', () => {
        const docA = createDocument();
        const docB: MandalaGridDocument = clone(docA);

        docB.columns[0].groups.pop();
        expect(compareDocuments(docA, docB)).toBe(false);
    });
    test('should not be equal: node', () => {
        const docA = createDocument();
        const docB: MandalaGridDocument = clone(docA);

        docB.columns[0].groups[0].nodes.pop();
        expect(compareDocuments(docA, docB)).toBe(false);
    });
});
