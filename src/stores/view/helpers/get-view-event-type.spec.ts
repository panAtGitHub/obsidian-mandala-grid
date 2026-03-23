import { describe, expect, it } from 'vitest';
import { getViewEventType } from 'src/stores/view/helpers/get-view-event-type';

describe('getViewEventType', () => {
    it('marks navigation-oriented active-node actions as activeNode events', () => {
        expect(getViewEventType('view/set-active-node/core-jump')).toEqual({
            activeNode: true,
        });
        expect(getViewEventType('view/set-active-node/9x9-nav')).toEqual({
            activeNode: true,
        });
        expect(getViewEventType('view/set-active-node/nx9-nav')).toEqual({
            activeNode: true,
        });
        expect(getViewEventType('view/set-active-node/focus-section')).toEqual(
            {
                activeNode: true,
            },
        );
    });
});
