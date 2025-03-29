import { debounce } from 'src/helpers/debounce';
import { drawDocument } from './draw-document';
import { updateScrollbarPosition } from 'src/stores/minimap/subscriptions/actions/set-scrollbar-position/update-scrollbar-position';
import { updateVisibleRange } from 'src/stores/minimap/subscriptions/effects/update-visible-range';

export class DebouncedMinimapEffects {
    drawDocument = debounce(drawDocument, 100);

    updateScrollbarPosition = debounce(updateScrollbarPosition, 16);

    updateVisibleRange = debounce(updateVisibleRange, 16);
}
