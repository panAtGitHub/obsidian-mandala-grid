import { describe, expect, it } from 'vitest';
import { buildCellDisplayPolicy } from './cell-display-policy';

describe('buildCellDisplayPolicy', () => {
    it('uses plain-with-pin for 3x3 cells and hides built-in hidden info', () => {
        const policy = buildCellDisplayPolicy({
            preset: 'grid-3x3',
            whiteThemeMode: true,
        });

        expect(policy.sectionIndicatorVariant).toBe('plain-with-pin');
        expect(policy.preserveActiveBackground).toBe(true);
        expect(policy.hideBuiltInHiddenInfo).toBe(true);
        expect(policy.scrollbarMode).toBe('selected-hover');
    });

    it('keeps plain labels for 9x9 cells', () => {
        const policy = buildCellDisplayPolicy({
            preset: 'grid-9x9',
        });

        expect(policy.sectionIndicatorVariant).toBe('plain');
        expect(policy.preserveActiveBackground).toBe(false);
        expect(policy.hideBuiltInHiddenInfo).toBe(true);
        expect(policy.scrollbarMode).toBe('hidden');
    });

    it('uses capsule mode for nx9 when white theme is off', () => {
        const policy = buildCellDisplayPolicy({
            preset: 'grid-nx9',
            whiteThemeMode: false,
        });

        expect(policy.sectionIndicatorVariant).toBe('section-capsule');
        expect(policy.preserveActiveBackground).toBe(false);
        expect(policy.scrollbarMode).toBe('selected-hover');
    });

    it('uses plain-with-pin for week 7x9 in white theme', () => {
        const policy = buildCellDisplayPolicy({
            preset: 'grid-7x9',
            whiteThemeMode: true,
            hasGridSelection: true,
        });

        expect(policy.sectionIndicatorVariant).toBe('plain-with-pin');
        expect(policy.preserveActiveBackground).toBe(true);
        expect(policy.scrollbarMode).toBe('selected-hover');
    });

    it('hides internal scrollbars for compact week cells', () => {
        const policy = buildCellDisplayPolicy({
            preset: 'grid-7x9',
            compactMode: true,
        });

        expect(policy.density).toBe('compact');
        expect(policy.scrollbarMode).toBe('hidden');
    });
});
