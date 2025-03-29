import { LineageView } from 'src/view/view';
import { minimapWorker } from 'src/workers/worker-instances';
import { cpx_to_dpx } from 'src/view/components/container/minimap/event-handlers/on-canvas-click';

export const updateVisibleRange = async (view: LineageView) => {
    const minimapStore = view.getMinimapStore();
    const state = minimapStore.getValue();
    const canvasId = state.canvasId;

    const payload = await minimapWorker.run({
        type: 'minimap/set/scroll-position',
        payload: {
            canvasId: canvasId,
            scroll_position_cpx: state.scrollInfo.scrollPosition_cpx,
        },
    });

    // payload is truthy only when the range is different
    if (payload && 'start_cpx' in payload) {
        const dom = view.getMinimapDom();
        const canvas = dom.canvas;
        requestAnimationFrame(async () => {
            const marginTop = cpx_to_dpx(payload.start_cpx) + 'px';
            await minimapWorker.run({
                type: 'minimap/draw-document',
                payload: {
                    canvasId: canvasId,
                },
            });
            canvas.style.marginTop = marginTop;
        });
    }
};
