import { describe, expect, it } from 'vitest';
import { buildCellInteractionPolicy } from './cell-interaction-policy';

describe('buildCellInteractionPolicy', () => {
    it('defaults to no mobile double click action', () => {
        expect(
            buildCellInteractionPolicy({}).mobileDoubleClickAction,
        ).toBe('none');
    });

    it('allows scenes to opt into subgrid navigation explicitly', () => {
        expect(
            buildCellInteractionPolicy({
                mobileDoubleClickAction: 'subgrid-navigation',
            }).mobileDoubleClickAction,
        ).toBe('subgrid-navigation');
    });
});
