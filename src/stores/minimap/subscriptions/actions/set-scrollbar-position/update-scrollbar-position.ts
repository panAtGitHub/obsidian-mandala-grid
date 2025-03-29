import { LineageView } from 'src/view/view';
import { calculateScrollDeltaToActiveCard } from 'src/stores/minimap/subscriptions/actions/set-scrollbar-position/calculate-scroll-delta-to-active-card';
import invariant from 'tiny-invariant';

export const updateScrollbarPosition = (view: LineageView) => {
    const minimapStore = view.getMinimapStore();
    const state = minimapStore.getValue();
    const activeCardRange = state.ranges.cards[state.activeCardId];
    invariant(activeCardRange);
    const minimapContainer = view.getMinimapDom().canvasContainer.parentElement;
    invariant(minimapContainer);
    const delta_cpx = calculateScrollDeltaToActiveCard(
        activeCardRange.y_start,
        activeCardRange.y_end,
        state.scrollInfo.totalDrawnHeight_cpx,
        state.scrollInfo.scrollPosition_cpx,
        minimapContainer.clientHeight,
    );

    if (typeof delta_cpx === 'number') {
        minimapStore.dispatch({
            type: 'minimap/set-scroll-position',
            payload: {
                position_cpx: Number(delta_cpx),
            },
        });
    }
};
