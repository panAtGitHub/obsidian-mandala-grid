import { LineageView } from 'src/view/view';

export const resetScrollPosition = (view: LineageView) => {
    const minimapStore = view.getMinimapStore();
    const state = minimapStore.getValue().scrollInfo;

    if (state.containerHeight_cpx === 0) return;

    const position_cpx = Math.max(
        0,
        state.totalDrawnHeight_cpx - state.containerHeight_cpx,
    );

    minimapStore.dispatch({
        type: 'minimap/set-scroll-position',
        payload: {
            position_cpx: position_cpx,
        },
    });
};
