import { describe, expect, it } from 'vitest';
import { getCurrentFileSubpath } from 'src/view/helpers/handle-links/helpers/get-current-file-subpath';

describe('getCurrentFileSubpath', () => {
    const currentFilePath = 'daily/⭕2026年，日计划.md';

    it('returns the full nested heading subpath for the current file', () => {
        const actual = getCurrentFileSubpath({
            link: '⭕2026年，日计划#2026-03-01#三件事',
            currentFilePath,
            resolveFirstLinkpathDest: (path) =>
                path === '⭕2026年，日计划'
                    ? { path: currentFilePath }
                    : null,
        });

        expect(actual).toBe('#2026-03-01#三件事');
    });

    it('supports local heading links without a file path', () => {
        const actual = getCurrentFileSubpath({
            link: '#三件事',
            currentFilePath,
            resolveFirstLinkpathDest: () => null,
        });

        expect(actual).toBe('#三件事');
    });

    it('returns null when the link points to another file', () => {
        const actual = getCurrentFileSubpath({
            link: '⭕2026年，周计划#本周三件事',
            currentFilePath,
            resolveFirstLinkpathDest: () => ({
                path: 'weekly/⭕2026年，周计划.md',
            }),
        });

        expect(actual).toBeNull();
    });
});
