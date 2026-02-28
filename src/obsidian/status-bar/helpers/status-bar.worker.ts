import {
    calculateStatusSummary,
    StatusSummary,
} from 'src/obsidian/status-bar/helpers/status-bar-summary';

export type DocumentProgressProps = {
    texts: string[];
    activeText: string;
};

export type WorkerEvent = {
    type: 'status-bar/calculate-document-progress';
    payload: DocumentProgressProps;
};
export type StatusBarWorkerResult = StatusSummary;

self.onmessage = (event: MessageEvent) => {
    const data = event.data as { id: string; payload: DocumentProgressProps };
    const payload = data.payload;
    const result = calculateStatusSummary(payload.texts, payload.activeText);
    self.postMessage({
        id: data.id,
        payload: result,
    });
};
