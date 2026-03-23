import { describe, expect, it } from 'vitest';
import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';

describe('createDefaultCellDisplayPolicy', () => {
    it('returns the standard cell presentation defaults', () => {
        expect(createDefaultCellDisplayPolicy()).toEqual({
            sectionIndicatorVariant: 'section-capsule',
            preserveActiveBackground: false,
            hideBuiltInHiddenInfo: true,
            contentLayout: 'intrinsic',
            density: 'normal',
            scrollbarMode: 'selected-hover',
            hoverBehavior: 'elevated',
            inactiveSurfaceMode: 'inline',
        });
    });
});
