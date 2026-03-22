import { MandalaView } from 'src/view/view';
import { AllDirections } from 'src/mandala-document/state/document-store-actions';
import { getElementById } from 'src/shared/lib/align-element/helpers/get-element-by-id';
import { findNearestVerticalScrollPane } from 'src/shared/lib/align-element/helpers/find-scrollable-pane';

export const scrollNode = (view: MandalaView, direction: AllDirections) => {
    const container = view.container;
    if (!container) return;
    const element = getElementById(
        container,
        view.viewStore.getValue().document.activeNode,
    );
    if (!element) return;
    const STEP = Math.floor(view.plugin.settings.getValue().view.cardWidth / 4);
    if (direction === 'down' || direction === 'up') {
        const scrollPane = findNearestVerticalScrollPane(element, container);
        if (!scrollPane) return;
        const scrollTop = direction === 'up' ? STEP : -STEP;
        requestAnimationFrame(() => {
            scrollPane.scrollBy({
                top: scrollTop,
                behavior: 'smooth',
            });
        });
    } else {
        const scrollLeft = direction === 'left' ? STEP : -STEP;
        requestAnimationFrame(() => {
            container.scrollBy({
                left: scrollLeft,
                behavior: 'smooth',
            });
        });
    }
};
