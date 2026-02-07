import { MandalaGridDocument } from 'src/stores/document/document-state-type';
import { StyleRule } from 'src/stores/settings/types/style-rules-types';
import { StyleRulesProcessor } from 'src/stores/view/subscriptions/effects/style-rules/workers/style-rules-processor';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import { StyleRulesResult } from '../helpers/process-style-rules';

type State = {
    [viewId: string]: StyleRulesProcessor;
};

export type RulesWorkerEvent = DestroyEvent | ProcessRulesEvent;

type DestroyEvent = {
    type: 'destroy';
    payload: {
        viewId: string;
    };
};

type ProcessRulesEvent = {
    type: 'process-rules';
    payload: {
        viewId: string;
        document: MandalaGridDocument;
        rules: StyleRule[];
        action: DocumentStoreAction | null;
    };
};

const state: State = {};

self.onmessage = (message: MessageEvent) => {
    const event = message.data as { id: string; payload: RulesWorkerEvent };
    const { id, payload } = event;
    let result: null | StyleRulesResult = null;
    switch (payload.type) {
        case 'destroy': {
            delete state[payload.payload.viewId];
            break;
        }

        case 'process-rules': {
            if (!state[payload.payload.viewId]) {
                state[payload.payload.viewId] = new StyleRulesProcessor();
            }
            const processor = state[payload.payload.viewId];
            result = processor.processStyleRules(
                payload.payload.document,
                payload.payload.rules,
                payload.payload.action,
            );
            break;
        }

        default:
            // Exhaustive check to keep worker messages in sync with RulesWorkerEvent.
            throw new Error(
                `Unhandled event type: ${JSON.stringify(payload as never)}`,
            );
    }
    self.postMessage({ id, payload: result });
};
