import { LineageView } from 'src/view/view';
import { minimapWorker } from 'src/workers/worker-instances';
import invariant from 'tiny-invariant';

export const drawDocument = async (view: LineageView) => {
    const minimapStore = view.getMinimapStore();
    const state = minimapStore.getValue();
    const lineageDocument = view.documentStore.getValue().document;
    const canvasId = state.canvasId;
    const activeCardId = state.activeCardId;

    const payload = await minimapWorker.run({
        type: 'minimap/set/document',
        payload: {
            document: lineageDocument,
            canvasId: canvasId,
            activeNodeId: activeCardId,
        },
    });
    invariant(payload);
    if ('cardRanges' in payload) {
        minimapStore.dispatch({
            type: 'minimap/set-card-ranges',
            payload: {
                ranges: payload.cardRanges,
                height_cpx: payload.totalDrawnHeight_cpx,
            },
        });
    }
};
