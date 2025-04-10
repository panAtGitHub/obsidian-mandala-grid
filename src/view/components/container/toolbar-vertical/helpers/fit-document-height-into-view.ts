import invariant from 'tiny-invariant';
import { get } from 'svelte/store';
import { zoomLevelStore } from 'src/stores/view/derived/zoom-level-store';
import { getCombinedBoundingClientRect } from 'src/lib/align-element/helpers/get-combined-client-rect';
import { LineageView } from 'src/view/view';

export const fitDocumentHeightIntoView = async (view: LineageView) => {
    invariant(view.container);
    const initialZoomLevel = get(zoomLevelStore(view));
    view.plugin.settings.dispatch({
        type: 'settings/view/set-zoom-level',
        payload: { value: 1 },
    });
    const columns = Array.from(
        view.containerEl.querySelectorAll('.column'),
    ) as HTMLElement[];
    let result = 1;
    if (columns.length) {
        const groupHeights = columns
            .map((c) => {
                return getCombinedBoundingClientRect(
                    Array.from((c as HTMLElement).querySelectorAll('.group')),
                ).height;
            })
            .sort((a, b) => a - b);
        const height = groupHeights[groupHeights.length - 1];
        const width = getCombinedBoundingClientRect(columns).width;

        // eslint-disable-next-line no-undef
        const heightScale =
            view.container.getBoundingClientRect().height / (height + 100);
        const widthScale =
            view.container.getBoundingClientRect().width / (width + 100);

        result = Math.min(heightScale, widthScale);
    }
    // restore zoom level
    view.plugin.settings.dispatch({
        type: 'settings/view/set-zoom-level',
        payload: { value: initialZoomLevel },
    });
    return result;
};
