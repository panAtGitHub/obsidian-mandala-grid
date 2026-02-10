import { MandalaView } from 'src/view/view';
import invariant from 'tiny-invariant';
import { CANVAS_WIDTH_CPX } from 'src/stores/minimap/subscriptions/effects/minimap-canvas/worker/consts/constants';
import { SilentError } from 'src/lib/errors/errors';

export const setMinimapDom = (view: MandalaView) => {
    const minimapContainer = view.contentEl.querySelector(
        '.minimap-container',
    );

    if (!minimapContainer)
        throw new SilentError('minimapContainer is undefined');

    const canvasContainer = minimapContainer.querySelector<HTMLElement>(
        '.canvas-container',
    );
    invariant(canvasContainer);
    const scrollIndicator = minimapContainer.querySelector(
        '#scrollIndicator',
    ) as HTMLElement;
    const canvas = minimapContainer.querySelector('canvas');
    invariant(scrollIndicator);
    invariant(canvas);
    canvas.width = CANVAS_WIDTH_CPX;
    const offscreen = canvas.transferControlToOffscreen();
    const dom = {
        offscreen,
        canvas,
        scrollIndicator,
        canvasContainer: canvasContainer,
    };
    view.setMinimapDom(dom);
};
