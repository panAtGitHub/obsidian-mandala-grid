import invariant from 'tiny-invariant';
import { get } from 'svelte/store';
import { zoomLevelStore } from 'src/stores/view/derived/zoom-level-store';
import { getCombinedBoundingClientRect } from 'src/lib/align-element/helpers/get-combined-client-rect';
import { LineageView } from 'src/view/view';

export const fitBranchIntoView = async (view: LineageView) => {
    invariant(view.container);
    const initialZoomLevel = get(zoomLevelStore(view));
    view.plugin.settings.dispatch({
        type: 'settings/view/set-zoom-level',
        payload: { value: 1 },
    });

    let result = 1;

    const parents = Array.from(
        view.containerEl.querySelectorAll('.active-parent'),
    ) as HTMLElement[];

    const activeNode = view.containerEl.querySelector(
        '.active-node',
    ) as HTMLElement;
    const children = Array.from(
        view.containerEl.querySelectorAll('.active-child'),
    ) as HTMLElement[];
    const siblings = Array.from(
        view.containerEl.querySelectorAll('.active-sibling'),
    ) as HTMLElement[];

    const combinedRect = getCombinedBoundingClientRect([
        ...parents,
        activeNode,
        ...siblings,
        ...children,
    ]);

    const heightScale =
        view.container.getBoundingClientRect().height /
        (combinedRect.height + 100);
    const widthScale =
        view.container.getBoundingClientRect().width /
        (combinedRect.width + 100);

    result = Math.min(heightScale, widthScale);

    // restore zoom level
    view.plugin.settings.dispatch({
        type: 'settings/view/set-zoom-level',
        payload: { value: initialZoomLevel },
    });

    return result;
};
