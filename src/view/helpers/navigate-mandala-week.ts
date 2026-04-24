import { addDaysIsoDate } from 'src/mandala-display/logic/day-plan';
import type { MandalaView } from 'src/view/view';

export const setMandalaWeekAnchorDate = (view: MandalaView, date: string) => {
    view.viewStore.dispatch({
        type: 'view/mandala/week-anchor-date/set',
        payload: { date },
    });
    view.viewStore.dispatch({
        type: 'view/mandala/week-active-cell/set',
        payload: { cell: null },
    });
};

export const navigateMandalaWeek = (
    view: MandalaView,
    direction: 'prev' | 'next',
) => {
    const anchorDate = view.mandalaWeekAnchorDate;
    if (!anchorDate) return false;

    setMandalaWeekAnchorDate(
        view,
        addDaysIsoDate(anchorDate, direction === 'prev' ? -7 : 7),
    );
    return true;
};
