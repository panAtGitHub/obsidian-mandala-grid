import { describe, expect, it } from 'vitest';
import { defaultDocumentState } from 'src/stores/document/default-document-state';
import { getDocumentEventType } from 'src/stores/view/helpers/get-document-event-type';

describe('getDocumentEventType', () => {
    it('marks asymmetric mandala swaps as structural events', () => {
        const state = defaultDocumentState();
        state.meta.mandalaV2.lastMutation = {
            actionType: 'document/mandala/swap',
            changedSections: ['2.3', '2.7'],
            structural: true,
        };

        expect(
            getDocumentEventType(
                {
                    type: 'document/mandala/swap',
                    payload: {
                        sourceNodeId: 'n23',
                        targetNodeId: 'n27',
                    },
                },
                state,
            ),
        ).toMatchObject({
            content: true,
            createOrDelete: true,
            structural: true,
        });
    });

    it('keeps same-shape mandala swaps on the content path', () => {
        const state = defaultDocumentState();
        state.meta.mandalaV2.lastMutation = {
            actionType: 'document/mandala/swap',
            changedSections: ['2.3', '2.7'],
            structural: false,
        };

        expect(
            getDocumentEventType(
                {
                    type: 'document/mandala/swap',
                    payload: {
                        sourceNodeId: 'n23',
                        targetNodeId: 'n27',
                    },
                },
                state,
            ),
        ).toMatchObject({
            content: true,
        });
        expect(
            getDocumentEventType(
                {
                    type: 'document/mandala/swap',
                    payload: {
                        sourceNodeId: 'n23',
                        targetNodeId: 'n27',
                    },
                },
                state,
            ).createOrDelete,
        ).toBeUndefined();
    });
});
