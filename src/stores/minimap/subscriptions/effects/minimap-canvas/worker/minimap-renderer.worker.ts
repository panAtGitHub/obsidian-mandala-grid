import { MinimapRenderer } from 'src/stores/minimap/subscriptions/effects/minimap-canvas/minimap-renderer';
import { MandalaGridDocument } from 'src/stores/document/document-state-type';
import { MinimapTheme } from 'src/stores/minimap/subscriptions/effects/minimap-canvas/worker/consts/minimap-theme';
import { chunkPositionsCache } from 'src/stores/minimap/subscriptions/effects/minimap-canvas/worker/shapes/helpers/chunk-positions-cache';

type State = {
    canvases: {
        [canvasId: string]: {
            minimap: MinimapRenderer;
        };
    };
};

const state: State = {
    canvases: {},
};
export type CanvasWorkerProps =
    | {
          type: 'worker/initialize';
          payload: {
              canvas: OffscreenCanvas;
              canvasId: string;
              theme: MinimapTheme;
              canvas_height_cpx: number;
          };
      }
    | {
          payload: {
              canvasId: string;
          };
          type: 'worker/destroy';
      }
    | MinimapEvent
    | {
          type: 'minimap/set/document';
          payload: {
              document: MandalaGridDocument;
              activeNodeId: string;
              canvasId: string;
          };
      }
    | {
          type: 'minimap/set/scroll-position';
          payload: {
              canvasId: string;
              scroll_position_cpx: number;
          };
      }
    | {
          type: 'minimap/draw-document';
          payload: {
              canvasId: string;
          };
      };

export type MinimapEvent = {
    type: 'minimap/update-theme';
    payload: {
        theme: MinimapTheme;
        canvasId: string;
    };
};

self.onmessage = (message: MessageEvent) => {
    const workerMessage = message.data as {
        id: string;
        payload: CanvasWorkerProps;
    };
    const event = workerMessage.payload;
    let result = null;
    if (event.type === 'worker/initialize') {
        const ctx = event.payload.canvas.getContext('2d');
        if (ctx) {
            state.canvases[event.payload.canvasId] = {
                minimap: new MinimapRenderer(
                    ctx,
                    event.payload.canvas,
                    event.payload.theme,
                    event.payload.canvas_height_cpx,
                ),
            };
        }
    } else if (event.type === 'worker/destroy') {
        delete state.canvases[event.payload.canvasId];
        chunkPositionsCache.deleteCanvasCache(event.payload.canvasId);
    } else {
        const viewCanvas = state.canvases[event.payload.canvasId];
        if (!viewCanvas) {
            throw new Error('no canvas context');
        }
        if (event.type === 'minimap/update-theme') {
            viewCanvas.minimap.setTheme(event.payload.theme);
        } else if (event.type === 'minimap/set/document') {
            result = viewCanvas.minimap.setDocument(
                event.payload.document,
                event.payload.canvasId,
            );
        } else if (event.type === 'minimap/set/scroll-position') {
            result = viewCanvas.minimap.setScrollPosition(
                event.payload.scroll_position_cpx,
            );
        } else if (event.type === 'minimap/draw-document') {
            viewCanvas.minimap.drawDocument();
        }
    }
    self.postMessage({
        id: workerMessage.id,
        payload: result,
    });
};
