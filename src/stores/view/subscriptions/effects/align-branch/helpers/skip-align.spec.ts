import { describe, expect, it } from 'vitest';
import { skipAlign } from 'src/stores/view/subscriptions/effects/align-branch/helpers/skip-align';

describe('skipAlign', () => {
    it('always skips mandala navigation-specific active-node actions', () => {
        const view = {
            documentStore: {
                getValue: () => ({
                    meta: {
                        isMandala: false,
                    },
                }),
            },
        };

        expect(
            skipAlign(view as never, {
                type: 'view/set-active-node/core-jump',
            } as never),
        ).toBe(true);
        expect(
            skipAlign(view as never, {
                type: 'view/set-active-node/9x9-nav',
            } as never),
        ).toBe(true);
        expect(
            skipAlign(view as never, {
                type: 'view/set-active-node/nx9-nav',
            } as never),
        ).toBe(true);
        expect(
            skipAlign(view as never, {
                type: 'view/set-active-node/focus-section',
            } as never),
        ).toBe(true);
    });
});
