import { describe, expect, it } from 'vitest';
import { buildCellInteractionPolicy } from './cell-interaction-policy';

describe('buildCellInteractionPolicy', () => {
    it('enables subgrid navigation only for 3x3', () => {
        expect(
            buildCellInteractionPolicy({ preset: 'grid-3x3' })
                .mobileDoubleClickAction,
        ).toBe('subgrid-navigation');

        expect(
            buildCellInteractionPolicy({ preset: 'grid-7x9' })
                .mobileDoubleClickAction,
        ).toBe('none');

        expect(
            buildCellInteractionPolicy({ preset: 'grid-nx9' })
                .mobileDoubleClickAction,
        ).toBe('none');

        expect(
            buildCellInteractionPolicy({ preset: 'grid-9x9' })
                .mobileDoubleClickAction,
        ).toBe('none');
    });
});
