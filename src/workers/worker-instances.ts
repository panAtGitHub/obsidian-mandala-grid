import type { CanvasWorkerProps } from 'src/stores/minimap/subscriptions/effects/minimap-canvas/worker/minimap-renderer.worker';
import * as DrawMinimapWorkerModule from 'src/stores/minimap/subscriptions/effects/minimap-canvas/worker/minimap-renderer.worker';
import { CardRanges } from 'src/stores/minimap/minimap-state-type';
import type { RulesWorkerEvent } from 'src/stores/view/subscriptions/effects/style-rules/workers/style-rules.worker';
import * as RulesWorkerModule from 'src/stores/view/subscriptions/effects/style-rules/workers/style-rules.worker';
import { StyleRulesResult } from 'src/stores/view/subscriptions/effects/style-rules/helpers/process-style-rules';
import { WorkerPromise } from 'src/helpers/worker-promise';
import type { StatusBarWorkerResult } from 'src/obsidian/status-bar/helpers/status-bar.worker';
import * as StatusBarWorkerModule from 'src/obsidian/status-bar/helpers/status-bar.worker';
import { DocumentProgressProps } from 'src/obsidian/status-bar/helpers/calculate-document-prorgess';
import { VisibleRange } from 'src/stores/minimap/subscriptions/effects/minimap-canvas/worker/renderer/visible-range-manager';

const resolveWorkerCtor = (module: unknown): (new () => Worker) => {
    return (module as { default: new () => Worker }).default;
};
const DrawMinimapWorker = resolveWorkerCtor(DrawMinimapWorkerModule);
const RulesWorker = resolveWorkerCtor(RulesWorkerModule);
const StatusBarWorker = resolveWorkerCtor(StatusBarWorkerModule);

export const minimapWorker = new WorkerPromise<
    CanvasWorkerProps,
    | null
    | {
          totalDrawnHeight_cpx: number;
          cardRanges: CardRanges;
      }
    | VisibleRange,
    OffscreenCanvas
>(new DrawMinimapWorker());

export const rulesWorker = new WorkerPromise<
    RulesWorkerEvent,
    null | StyleRulesResult
>(new RulesWorker());

export const statusBarWorker = new WorkerPromise<
    DocumentProgressProps,
    StatusBarWorkerResult
>(new StatusBarWorker());
