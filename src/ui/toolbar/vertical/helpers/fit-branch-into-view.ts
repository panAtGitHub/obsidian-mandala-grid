import invariant from 'tiny-invariant';
import { get } from 'svelte/store';
import { zoomLevelStore } from 'src/stores/view/derived/zoom-level-store';
import { getCombinedBoundingClientRect } from 'src/lib/align-element/helpers/get-combined-client-rect';
import { MandalaView } from 'src/view/view';

export const fitBranchIntoView = (view: MandalaView) => {
    invariant(view.container);
    const initialZoomLevel = get(zoomLevelStore(view));
    view.plugin.settings.dispatch({
        type: 'settings/view/set-zoom-level',
        payload: { value: 1 },
    });

    let result = 1;

    const parents = Array.from(
        view.container.querySelectorAll<HTMLElement>('.active-parent'),
    );

    const activeNode = view.container.querySelector(
        '.active-node',
    ) as HTMLElement;
    const children = Array.from(
        view.container.querySelectorAll<HTMLElement>('.active-child'),
    );
    const siblings = Array.from(
        view.container.querySelectorAll<HTMLElement>('.active-sibling'),
    );

    const combinedRect = getCombinedBoundingClientRect([
        ...parents,
        activeNode,
        ...siblings,
        ...children,
    ]);

    const boundingClientRect = view.container.getBoundingClientRect();
    const heightScale = boundingClientRect.height / (combinedRect.height + 100);
    const widthScale = boundingClientRect.width / (combinedRect.width + 100);

    result = Math.min(heightScale, widthScale);

    // restore zoom level
    view.plugin.settings.dispatch({
        type: 'settings/view/set-zoom-level',
        payload: { value: initialZoomLevel },
    });

    return result;
};
