import invariant from 'tiny-invariant';
import { get } from 'svelte/store';
import { zoomLevelStore } from 'src/stores/view/derived/zoom-level-store';
import { getCombinedBoundingClientRect } from 'src/shared/lib/align-element/helpers/get-combined-client-rect';
import { MandalaView } from 'src/view/view';

export const fitBranchIntoView = (view: MandalaView) => {
    invariant(view.container);
    const initialZoomLevel = get(zoomLevelStore(view));
    view.plugin.settings.dispatch({
        type: 'settings/view/set-zoom-level',
        payload: { value: 1 },
    });

    let result = 1;

    const focusedElements = Array.from(
        view.container.querySelectorAll<HTMLElement>(
            [
                '.mandala-card.active-node',
                '.mandala-card.node-border--selected',
                '.simple-cell.is-active',
                '.simple-cell.is-active-cell',
                '.row-matrix-cell.is-active-cell',
                '.row-matrix-cell.is-active-node',
                '.nx9-cell.is-active-cell',
                '.nx9-cell.is-active-node',
                '.week-plan-cell.is-active-cell',
                '.week-plan-cell.is-active-node',
            ].join(', '),
        ),
    );
    if (focusedElements.length) {
        const combinedRect = getCombinedBoundingClientRect(focusedElements);

        const boundingClientRect = view.container.getBoundingClientRect();
        const heightScale = boundingClientRect.height / (combinedRect.height + 100);
        const widthScale = boundingClientRect.width / (combinedRect.width + 100);

        result = Math.min(heightScale, widthScale);
    }

    // restore zoom level
    view.plugin.settings.dispatch({
        type: 'settings/view/set-zoom-level',
        payload: { value: initialZoomLevel },
    });

    return result;
};
