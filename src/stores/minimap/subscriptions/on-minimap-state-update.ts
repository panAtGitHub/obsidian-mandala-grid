import { LineageView } from 'src/view/view';
import { MinimapStoreAction } from 'src/stores/minimap/minimap-store-actions';
import invariant from 'tiny-invariant';
import { MinimapState } from 'src/stores/minimap/minimap-state-type';

export const onMinimapStateUpdate = (
    view: LineageView,
    action: MinimapStoreAction,
    state: MinimapState,
) => {
    const minimapStore = view.minimapStore;
    invariant(minimapStore);
    if (action.type === 'minimap/set-card-ranges') {
        view.minimapEffects.updateScrollbarPosition(view);
    } else if (action.type === 'minimap/set-active-node') {
        if (state.ranges.cards[state.activeCardId]) {
            view.minimapEffects.updateScrollbarPosition(view);
        }
    } else if (action.type === 'minimap/set-scroll-position') {
        view.minimapEffects.updateVisibleRange(view);
    }
};
