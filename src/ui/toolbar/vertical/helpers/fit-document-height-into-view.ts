import invariant from 'tiny-invariant';
import { get } from 'svelte/store';
import { zoomLevelStore } from 'src/stores/view/derived/zoom-level-store';
import { getCombinedBoundingClientRect } from 'src/lib/align-element/helpers/get-combined-client-rect';
import { MandalaView } from 'src/view/view';

export const fitDocumentHeightIntoView = (view: MandalaView) => {
    invariant(view.container);
    const initialZoomLevel = get(zoomLevelStore(view));
    view.plugin.settings.dispatch({
        type: 'settings/view/set-zoom-level',
        payload: { value: 1 },
    });
    const columns = Array.from(
        view.container.querySelectorAll<HTMLElement>('.column'),
    );
    let result = 1;
    if (columns.length) {
        const groupHeights = columns
            .map((c) => {
                return getCombinedBoundingClientRect(
                    Array.from(c.querySelectorAll<HTMLElement>('.group')),
                ).height;
            })
            .sort((a, b) => a - b);
        const height = groupHeights[groupHeights.length - 1];
        const width = getCombinedBoundingClientRect(columns).width;
        const boundingClientRect = view.container.getBoundingClientRect();
        const heightScale = boundingClientRect.height / (height + 100);
        const widthScale = boundingClientRect.width / (width + 100);

        result = Math.min(heightScale, widthScale);
    }
    // restore zoom level
    view.plugin.settings.dispatch({
        type: 'settings/view/set-zoom-level',
        payload: { value: initialZoomLevel },
    });
    return result;
};
