import { describe, expect, it, vi } from 'vitest';

import {
    navigateMandalaWeek,
    setMandalaWeekAnchorDate,
} from 'src/view/helpers/navigate-mandala-week';

type DispatchMock = ReturnType<typeof vi.fn<[unknown], void>>;
type ViewStub = {
    mandalaWeekAnchorDate: string | null;
    viewStore: {
        dispatch: DispatchMock;
    };
};

describe('navigateMandalaWeek', () => {
    it('sets the week anchor date and clears the week active cell', () => {
        const dispatch = vi.fn<[unknown], void>();
        const view = {
            mandalaWeekAnchorDate: '2026-04-24',
            viewStore: {
                dispatch,
            },
        } satisfies ViewStub;

        setMandalaWeekAnchorDate(view as never, '2026-04-17');

        expect(dispatch).toHaveBeenNthCalledWith(1, {
            type: 'view/mandala/week-anchor-date/set',
            payload: { date: '2026-04-17' },
        });
        expect(dispatch).toHaveBeenNthCalledWith(2, {
            type: 'view/mandala/week-active-cell/set',
            payload: { cell: null },
        });
    });

    it('moves to the previous and next week by exactly 7 days', () => {
        const prevDispatch = vi.fn<[unknown], void>();
        const nextDispatch = vi.fn<[unknown], void>();
        const prevView = {
            mandalaWeekAnchorDate: '2026-04-24',
            viewStore: {
                dispatch: prevDispatch,
            },
        } satisfies ViewStub;
        const nextView = {
            mandalaWeekAnchorDate: '2026-04-24',
            viewStore: {
                dispatch: nextDispatch,
            },
        } satisfies ViewStub;

        expect(navigateMandalaWeek(prevView as never, 'prev')).toBe(true);
        expect(navigateMandalaWeek(nextView as never, 'next')).toBe(true);

        expect(prevDispatch).toHaveBeenNthCalledWith(1, {
            type: 'view/mandala/week-anchor-date/set',
            payload: { date: '2026-04-17' },
        });
        expect(nextDispatch).toHaveBeenNthCalledWith(1, {
            type: 'view/mandala/week-anchor-date/set',
            payload: { date: '2026-05-01' },
        });
    });

    it('is a no-op when the week anchor date is missing', () => {
        const dispatch = vi.fn<[unknown], void>();
        const view = {
            mandalaWeekAnchorDate: null,
            viewStore: {
                dispatch,
            },
        } satisfies ViewStub;

        expect(navigateMandalaWeek(view as never, 'prev')).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
    });
});
