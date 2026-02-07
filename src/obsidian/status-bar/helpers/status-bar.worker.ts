import { DocumentProgressProps } from 'src/obsidian/status-bar/helpers/calculate-document-prorgess';
import { MandalaGridDocument } from 'src/stores/document/document-state-type';

export type WorkerEvent = {
    type: 'status-bar/calculate-document-progress';
    payload: DocumentProgressProps;
};
export type StatusBarWorkerResult = {
    nonEmptySections: number;
    currentSectionChars: number;
    totalChars: number;
};

const normalizeCharsCount = (text: string | undefined) => {
    if (!text) return 0;
    return text.replace(/\s+/g, '').length;
};

const calculateStatusMetrics = (
    document: MandalaGridDocument,
    activeNode: string,
): StatusBarWorkerResult => {
    const content = document.content;
    const allValues = Object.values(content);

    let nonEmptySections = 0;
    let totalChars = 0;

    for (const item of allValues) {
        const text = item?.content ?? '';
        const trimmed = text.trim();
        if (trimmed.length > 0) {
            nonEmptySections += 1;
        }
        totalChars += normalizeCharsCount(text);
    }

    const currentSectionChars = normalizeCharsCount(content[activeNode]?.content);

    return {
        nonEmptySections,
        currentSectionChars,
        totalChars,
    };
};

self.onmessage = (event: MessageEvent) => {
    const payload = event.data.payload as DocumentProgressProps;
    const result = calculateStatusMetrics(payload.document, payload.activeNode);
    self.postMessage({
        id: event.data.id,
        payload: result,
    });
};
