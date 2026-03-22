import { describe, expect, test } from 'vitest';
import { hasNBulletListItems } from 'src/shared/lib/format-detection/has-n-bullet-list-items';

describe('hasNBulletListItems', () => {
    test('should return false for an empty string', () => {
        expect(hasNBulletListItems('')).toBe(false);
    });
    test('should return false for multiple empty lines', () => {
        expect(hasNBulletListItems(['', '', ''].join('\n'))).toBe(false);
    });

    test('case 1', () => {
        const input = ['- 1', '- 2', '- 3'].join('\n');
        expect(hasNBulletListItems(input)).toBe(true);
    });

    test('case 2', () => {
        const input = ['- 1', '', '- 3'].join('\n');
        expect(hasNBulletListItems(input)).toBe(true);
    });

    test('case 3', () => {
        const input = ['\t- 1', '\t- 2', '\t- 3'].join('\n');
        expect(hasNBulletListItems(input)).toBe(true);
    });

    test('case 4', () => {
        const input = ['  Subitem 1', '  Subitem 2', '  Subitem 3'].join('\n');
        expect(hasNBulletListItems(input)).toBe(false);
    });

    test('case 5', () => {
        const input = [
            '- parent',
            '  Subitem 1',
            '  Subitem 2',
            '  Subitem 3',
        ].join('\n');
        expect(hasNBulletListItems(input)).toBe(false);
    });

    test('case 6', () => {
        const input = [
            '- Bullet 1',
            '  Subitem 1',
            '- Bullet 2',
            '  Subitem 2',
        ].join('\n');
        expect(hasNBulletListItems(input)).toBe(true);
    });

    test('case 7', () => {
        const input = ['- Bullet 1', 'Invalid line', '- Bullet 2'].join('\n');
        expect(hasNBulletListItems(input)).toBe(true);
    });
});
