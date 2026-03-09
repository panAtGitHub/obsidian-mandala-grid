import { describe, expect, test } from 'vitest';
import {
    calculateStatusSummary,
    normalizeCharsCount,
} from 'src/obsidian/status-bar/helpers/status-bar-summary';

describe('status-bar-summary', () => {
    test('normalizes character count by removing whitespace', () => {
        expect(normalizeCharsCount(' a b \n c\t')).toEqual(3);
    });

    test('calculates summary from compact text payload', () => {
        expect(
            calculateStatusSummary(
                ['alpha beta', '', '  ', 'gamma\ndelta'],
                'gamma\ndelta',
            ),
        ).toEqual({
            nonEmptySections: 2,
            currentSectionChars: 10,
            totalChars: 19,
        });
    });
});
