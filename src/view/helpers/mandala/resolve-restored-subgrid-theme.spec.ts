import { describe, expect, it } from 'vitest';
import {
    deriveSubgridThemeFromSection,
    resolveRestoredSubgridTheme,
} from 'src/view/helpers/mandala/resolve-restored-subgrid-theme';

describe('deriveSubgridThemeFromSection', () => {
    it('returns the parent theme for child sections', () => {
        expect(deriveSubgridThemeFromSection('4.7')).toBe('4');
        expect(deriveSubgridThemeFromSection('4.7.2')).toBe('4.7');
    });

    it('keeps core sections and defaults to root', () => {
        expect(deriveSubgridThemeFromSection('4')).toBe('4');
        expect(deriveSubgridThemeFromSection(null)).toBe('1');
    });
});

describe('resolveRestoredSubgridTheme', () => {
    it('prefers a persisted subgrid theme when it still exists', () => {
        expect(
            resolveRestoredSubgridTheme({
                existingSections: new Set(['1', '4', '4.7']),
                persistedSubgridTheme: '4',
                lastActiveSection: '4.7',
            }),
        ).toBe('4');
    });

    it('falls back to the parent theme of the last active section', () => {
        expect(
            resolveRestoredSubgridTheme({
                existingSections: new Set(['1', '4', '4.7']),
                persistedSubgridTheme: null,
                lastActiveSection: '4.7',
            }),
        ).toBe('4');
    });

    it('returns root when neither persisted nor derived themes are valid', () => {
        expect(
            resolveRestoredSubgridTheme({
                existingSections: new Set(['1', '5']),
                persistedSubgridTheme: '4',
                lastActiveSection: '4.7',
            }),
        ).toBe('1');
    });
});
