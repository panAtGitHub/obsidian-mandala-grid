import invariant from 'tiny-invariant';
import { get } from 'svelte/store';
import { zoomLevelStore } from 'src/stores/view/derived/zoom-level-store';
import { getCombinedBoundingClientRect } from 'src/shared/lib/align-element/helpers/get-combined-client-rect';
import { MandalaView } from 'src/view/view';

export const fitDocumentHeightIntoView = (view: MandalaView) => {
    invariant(view.container);
    const initialZoomLevel = get(zoomLevelStore(view));
    view.plugin.settings.dispatch({
        type: 'settings/view/set-zoom-level',
        payload: { value: 1 },
    });
    const documentElements = Array.from(
        view.container.querySelectorAll<HTMLElement>(
            '.mandala-cell, .simple-cell, .week-plan-cell',
        ),
    );
    let result = 1;
    if (documentElements.length) {
        const combinedRect = getCombinedBoundingClientRect(documentElements);
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
