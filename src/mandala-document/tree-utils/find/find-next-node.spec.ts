import { describe, expect, test } from 'vitest';
import { findNextNode } from 'src/mandala-document/tree-utils/find/find-next-node';

describe('find-next-node', () => {
    const n1 = 'n1';
    const n1_1 = 'n1_1';
    const n1_2 = 'n1_2';
    const n1_2_1 = 'n1_2_1';
    const n2 = 'n2';
    const n1_3 = 'n1_3';
    const n3 = 'n3';
    const n4 = 'n4';
    const n5 = 'n5';
    const n6 = 'n6';
    const n7 = 'n7';
    const n8 = 'n8';
    const n9 = 'n9';
    const n10 = 'n10';
    const sections = {
        id_section: {
            [n1]: '1',
            [n1_1]: '1.1',
            [n1_2]: '1.2',
            [n1_2_1]: '1.2.1',
            [n1_3]: '1.3',
            [n2]: '2',
            [n3]: '3',
            [n4]: '4',
            [n5]: '5',
            [n6]: '6',
            [n7]: '7',
            [n8]: '8',
            [n9]: '9',
            [n10]: '10',
        },
        section_id: {
            '1': n1,
            '1.1': n1_1,
            '1.2': n1_2,
            '1.2.1': n1_2_1,
            '1.3': n1_3,
            '2': n2,
            '3': n3,
            '4': n4,
            '5': n5,
            '6': n6,
            '7': n7,
            '8': n8,
            '9': n9,
            '10': n10,
        },
    };

    const tuples = [
        [n1, n1_1],
        [n1_1, n1_2],
        [n1_2, n1_2_1],
        [n1_2_1, n1_3],
        [n1_3, n2],
    ];
    for (const tuple of tuples) {
        test('forward: ' + tuple.join(' - '), () => {
            expect(findNextNode(sections, tuple[0], 'forward', null)).toBe(
                tuple[1],
            );
        });
        test('back: ' + tuple.join(' - '), () => {
            expect(findNextNode(sections, tuple[1], 'back', null)).toBe(
                tuple[0],
            );
        });
    }
    test('edges', () => {
        expect(findNextNode(sections, n1, 'back', null)).toBe(n1);
        expect(findNextNode(sections, n10, 'forward', null)).toBe(n10);
    });

    test('case: 1', () => {
        expect(findNextNode(sections, n1_3, 'forward', null)).toBe(n2);
    });
    test('case: 2', () => {
        expect(findNextNode(sections, n10, 'back', null)).toBe(n9);
    });
});
