import { describe, expect, it } from 'vitest';
import { resolvePinnedItemColorStyle } from 'src/mandala-display/policies/pinned-item-color-style';

describe('resolvePinnedItemColorStyle', () => {
    it('builds pinned item background and text variables from the shared display color pipeline', () => {
        const style = resolvePinnedItemColorStyle({
            section: '1.2',
            backgroundMode: 'custom',
            sectionColorsBySection: {
                '1.2': '#677FEF',
            },
            sectionColorOpacity: 65,
            themeTone: 'light',
            themeUnderlayColor: '#ffffff',
        });

        expect(style).toContain('--pinned-item-bg: rgba(103, 127, 239, 0.65);');
        expect(style).toContain('--text-normal: #0f131a;');
    });
});
