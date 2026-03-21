import { MandalaView } from 'src/view/view';
import { findNearestVerticalScrollPane } from 'src/lib/align-element/helpers/find-scrollable-pane';

export const attachWheelScrollListener = (view: MandalaView) => {
    view.plugin.registerDomEvent(view.contentEl, 'wheel', (evt) => {
        if (!evt.altKey) return;
        if (evt.deltaY === 0) return;
        const target = evt.target as HTMLElement;
        const targetIsACard =
            target.hasClass('lng-prev') || target.closest('.lng-prev');
        if (!targetIsACard) return;

        const scrollPane = findNearestVerticalScrollPane(target, view.contentEl);
        if (!scrollPane) return;
        evt.preventDefault();
        evt.stopPropagation();
        requestAnimationFrame(() => {
            scrollPane.scrollBy({
                top: evt.deltaY * 2.5,
                behavior: 'smooth',
            });
        });
    });
};
