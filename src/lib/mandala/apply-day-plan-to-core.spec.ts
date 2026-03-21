import { describe, expect, it } from 'vitest';
import { shouldApplyDayPlanSlotTemplate } from 'src/lib/mandala/apply-day-plan-to-core';

describe('shouldApplyDayPlanSlotTemplate', () => {
    it('returns true when slot is empty', () => {
        expect(shouldApplyDayPlanSlotTemplate('')).toBe(true);
        expect(shouldApplyDayPlanSlotTemplate('\n\n')).toBe(true);
    });

    it('returns true when first non-empty line is plain text', () => {
        expect(shouldApplyDayPlanSlotTemplate('plain body')).toBe(true);
        expect(shouldApplyDayPlanSlotTemplate(' \ncontent')).toBe(true);
    });

    it('returns false when first non-empty line has a heading title', () => {
        expect(shouldApplyDayPlanSlotTemplate('### 09-12\nbody')).toBe(false);
        expect(shouldApplyDayPlanSlotTemplate('## custom title\nbody')).toBe(
            false,
        );
    });

    it('returns true when first heading line has no title text', () => {
        expect(shouldApplyDayPlanSlotTemplate('###   \nbody')).toBe(true);
        expect(shouldApplyDayPlanSlotTemplate('#\nbody')).toBe(true);
    });
});
