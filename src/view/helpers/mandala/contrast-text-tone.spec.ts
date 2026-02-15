import { describe, expect, it } from 'vitest';
import { getReadableTextTone } from './contrast-text-tone';

describe('getReadableTextTone', () => {
    it('returns null when background is missing or invalid', () => {
        expect(getReadableTextTone(null, 'dark')).toBeNull();
        expect(getReadableTextTone(undefined, 'light')).toBeNull();
        expect(
            getReadableTextTone('color-mix(in srgb, red 50%, blue)', 'dark'),
        ).toBeNull();
    });

    it('returns dark text tone for bright backgrounds', () => {
        expect(getReadableTextTone('#E9D967', 'dark')).toBe('dark');
        expect(getReadableTextTone('rgb(240, 240, 230)', 'light')).toBe('dark');
    });

    it('returns light text tone for dark backgrounds', () => {
        expect(getReadableTextTone('#2B3040', 'dark')).toBe('light');
        expect(getReadableTextTone('rgb(25, 25, 25)', 'light')).toBe('light');
    });

    it('takes alpha into account for rgba colors', () => {
        expect(getReadableTextTone('rgba(233, 217, 103, 0.65)', 'dark')).toBe(
            'dark',
        );
        expect(getReadableTextTone('rgba(233, 217, 103, 0.2)', 'dark')).toBe(
            'light',
        );
    });
});
