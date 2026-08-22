import { describe, expect, it } from 'vitest';
import { shouldRequestGridFocusFromPointer } from 'src/view/helpers/should-request-grid-focus-from-pointer';

const eventFor = (className: string | null, tagName = 'div') => {
    const match = className ?? tagName;
    const target = {
        closest: (selector: string) =>
            match && selector.includes(match) ? {} : null,
    };
    return { target } as unknown as MouseEvent;
};

describe('shouldRequestGridFocusFromPointer', () => {
    it('allows a click on the grid background', () => {
        expect(shouldRequestGridFocusFromPointer(eventFor(null))).toBe(true);
    });

    it('rejects clicks inside cards and editors', () => {
        expect(
            shouldRequestGridFocusFromPointer(eventFor('mandala-card')),
        ).toBe(false);
        expect(shouldRequestGridFocusFromPointer(eventFor('cm-editor'))).toBe(
            false,
        );
        expect(
            shouldRequestGridFocusFromPointer(
                eventFor('mandala-inline-editor'),
            ),
        ).toBe(false);
    });

    it('rejects clicks inside sidebars and controls', () => {
        expect(
            shouldRequestGridFocusFromPointer(
                eventFor('mandala-detail-sidebar'),
            ),
        ).toBe(false);
        expect(
            shouldRequestGridFocusFromPointer(eventFor(null, 'button')),
        ).toBe(false);
        expect(
            shouldRequestGridFocusFromPointer(eventFor(null, 'textarea')),
        ).toBe(false);
    });

    it('rejects contenteditable and role button targets', () => {
        expect(
            shouldRequestGridFocusFromPointer(
                eventFor('[contenteditable="true"]'),
            ),
        ).toBe(false);
        expect(
            shouldRequestGridFocusFromPointer(eventFor('[role="button"]')),
        ).toBe(false);
    });
});
