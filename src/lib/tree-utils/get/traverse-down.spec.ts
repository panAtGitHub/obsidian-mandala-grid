import { describe, expect, test } from 'vitest';
import { traverseDown } from 'src/lib/tree-utils/get/traverse-down';

describe('traverse down', () => {
    const n3 = 'nCm5trBxK';
    const n3_1 = 'nKxaHbIe3';
    const n3_1_1 = 'nCKqgEeq1';
    const c0 = 'cQGMieQDh';
    const c1 = 'cFqaCL7A_';
    const c2 = 'cZVzJFW8u';
    const c3 = 'cr2_e3c5i';
    const root = 'r7ROH-C08';
    const n1 = 'npnAdaQzm';
    const n2 = 'nYJ01kict';
    const n2_1 = 'nDCGSHchM';
    const n2_2 = 'nGnCK3-zH';
    const n2_1_1 = 'nwN42VuCN';
    const n2_1_2 = 'ndz-0OBzM';
    const n2_2_1 = 'nDICTKrmG';
    const n2_2_2 = 'ntOB0kyjB';
    const n2_2_2_1 = 'na5Fx-KQ1';
    const n3_1_1_1 = 'nanrCGdWu';
    const n3_1_1_2 = 'nysAcjwzV';
    const n3_1_1_3 = 'n6mmheXZt';

    const document = {
        columns: [
            { id: c0, groups: [{ parentId: root, nodes: [n1, n2, n3] }] },
            {
                id: c1,
                groups: [
                    { nodes: [n2_1, n2_2], parentId: n2 },
                    { nodes: [n3_1], parentId: n3 },
                ],
            },
            {
                id: c2,
                groups: [
                    { nodes: [n2_1_1, n2_1_2], parentId: n2_1 },
                    { nodes: [n2_2_1, n2_2_2], parentId: n2_2 },
                    { nodes: [n3_1_1], parentId: n3_1 },
                ],
            },
            {
                id: c3,
                groups: [
                    { nodes: [n2_2_2_1], parentId: n2_2_2 },
                    { nodes: [n3_1_1_1, n3_1_1_2, n3_1_1_3], parentId: n3_1_1 },
                ],
            },
        ],
    };

    test('case 1', () => {
        const childGroups = [n2, n2_1, n2_2, n2_2_2];
        const activeNode = n2;

        const actualChildGroups = traverseDown(
            document.columns,
            activeNode,
            true,
        );
        expect(actualChildGroups).toEqual(childGroups);
    });

    test('case 2', () => {
        const childGroups = [n3, n3_1, n3_1_1];
        const activeNode = n3;

        const actualChildGroups = traverseDown(
            document.columns,
            activeNode,
            true,
        );
        expect(actualChildGroups).toEqual(childGroups);
    });
});

describe('cases from move-node', () => {
    const c0 = 'c0';
    const c1 = 'c1';
    const c2 = 'c2';
    const c3 = 'c3';
    const root = 'root';
    const n1 = 'n1';
    const n2 = 'n2';
    const n1_1 = 'n1_1';
    const n1_2 = 'n1_2';
    const n1_3 = 'n1_3';
    const n2_1 = 'n2_1';
    const n2_2 = 'n2_2';
    const n1_1_1 = 'n1_1_1';
    const n1_1_2 = 'n1_1_2';
    const n1_2_1 = 'n1_2_1';
    const n1_2_2 = 'n1_2_2';
    const n2_1_1 = 'n2_1_1';
    const n1_1_1_1 = 'n1_1_1_1';
    const n1_2_1_1 = 'n1_2_1_1';
    const document = {
        columns: [
            { id: c0, groups: [{ nodes: ['naO-'], parentId: root }] },
            {
                id: c1,
                groups: [
                    { nodes: [n1, n2], parentId: n1_3 },
                    { nodes: ['ntNg', 'nany', n1_3], parentId: 'naO-' },
                ],
            },
            {
                id: c2,
                groups: [
                    { nodes: [n1_1, n1_2], parentId: n1 },
                    { nodes: [n2_1, n2_2], parentId: n2 },
                    { nodes: ['nvTy', n1_1_2], parentId: 'ntNg' },
                    { nodes: [n1_2_1, n1_2_2], parentId: 'nany' },
                ],
            },
            {
                id: c3,
                groups: [
                    { nodes: [n1_1_1], parentId: n1_1 },
                    { nodes: [n2_1_1], parentId: n2_1 },
                    { nodes: [n1_1_1_1], parentId: 'nvTy' },
                    { nodes: [n1_2_1_1], parentId: n1_2_1 },
                ],
            },
        ],
    };

    test('case 1', () => {
        const childGroups = [n1_3, n1, n2, n1_1, n2_1];
        const activeNode = n1_3;
        const actualChildGroups = traverseDown(
            document.columns,
            activeNode,
            false,
        );
        expect(actualChildGroups).toEqual(childGroups);
    });
    test('case 2', () => {
        const childGroups = [n1_3, n1, n2, n1_1, n2_1];
        const activeNode = n1_3;
        const actualChildGroups = traverseDown(
            document.columns,
            activeNode,
            false,
        );
        expect(actualChildGroups).toEqual(childGroups);
    });

    test('case 3', () => {
        const c0 = 'c0';
        const c1 = 'c1';
        const c2 = 'c2';
        const root = 'root';
        const n1 = 'n1';
        const n2 = 'n2';
        const n1_1 = 'n1_1';
        const n2_1 = 'n2_1';
        const n2_2 = 'n2_2';
        const n1_1_1 = 'n1_1_1';
        const n1_1_2 = 'n1_1_2';
        const n1_1_3 = 'n1_1_3';
        const n1_1_3_1 = 'n1_1_3_1';
        const n1_1_3_2 = 'n1_1_3_2';
        const n2_1_1 = 'n2_1_1';
        const n2_2_1 = 'n2_2_1';
        const n2_2_2 = 'n2_2_2';

        const document = {
            columns: [
                { id: c0, groups: [{ nodes: [n1, n2], parentId: root }] },
                {
                    id: c1,
                    groups: [
                        { nodes: [n1_1], parentId: n1 },
                        { nodes: [n2_1, n2_2], parentId: n2 },
                    ],
                },
                {
                    id: c2,
                    groups: [
                        { nodes: [n1_1_1, n1_1_2, n1_1_3], parentId: n1_1 },
                        { nodes: [n1_1_3_1, n1_1_3_2], parentId: n1_1_3 },
                        { nodes: [n2_1_1], parentId: n2_1 },
                        { nodes: [n2_2_1, n2_2_2], parentId: n2_2 },
                    ],
                },
            ],
        };
        const childGroups = [n1_1_3];
        const activeNode = n1_1_3;
        const actualChildGroups = traverseDown(
            document.columns,
            activeNode,
            false,
        );
        expect(actualChildGroups).toEqual(childGroups);
    });

    test('case 4', () => {
        const c0 = 'c0';
        const c1 = 'c1';
        const c2 = 'c2';
        const c3 = 'c3';
        const c4 = 'c4';
        const root = 'root';
        const n1 = 'n1';
        const n2 = 'n2';
        const n1_1 = 'n1_1';
        const n1_2 = 'n1_2';
        const n2_1 = 'n2_1';
        const n2_2 = 'n2_2';
        const n1_1_1 = 'n1_1_1';
        const n1_1_2 = 'n1_1_2';
        const n1_2_1 = 'n1_2_1';
        const n1_2_2 = 'n1_2_2';
        const n2_1_1 = 'n2_1_1';
        const n1_1_1_1 = 'n1_1_1_1';
        const n1_2_1_1 = 'n1_2_1_1';
        const n1_1_1_1_1 = 'n1_1_1_1_1';

        const document = {
            columns: [
                { id: c0, groups: [{ nodes: ['ngQD'], parentId: root }] },
                {
                    id: c1,
                    groups: [
                        { nodes: [n1, n2], parentId: n1_1_1_1_1 },
                        { nodes: ['nrSz', 'nX72'], parentId: 'ngQD' },
                    ],
                },
                {
                    id: c2,
                    groups: [
                        { nodes: [n1_1, n1_2], parentId: n1 },
                        { nodes: [n2_1, n2_2], parentId: n2 },
                        { nodes: ['nitG', n1_1_2], parentId: 'nrSz' },
                        { nodes: [n1_2_1, n1_2_2], parentId: 'nX72' },
                    ],
                },
                {
                    id: c3,
                    groups: [
                        { nodes: [n1_1_1], parentId: n1_1 },
                        { nodes: [n2_1_1], parentId: n2_1 },
                        { nodes: [n1_1_1_1], parentId: 'nitG' },
                        { nodes: [n1_2_1_1], parentId: n1_2_1 },
                    ],
                },
                {
                    id: c4,
                    groups: [{ nodes: [n1_1_1_1_1], parentId: n1_1_1_1 }],
                },
            ],
        };

        const childGroups = [n1_1_1_1_1, n1, n2, n1_1, n2_1];
        const activeNode = n1_1_1_1_1;
        const actualChildGroups = traverseDown(
            document.columns,
            activeNode,
            false,
        );
        expect(actualChildGroups).toEqual(childGroups);
    });
});
