import { describe, expect, it } from 'vitest';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import { isStructuralDocumentChange } from 'src/stores/view/subscriptions/helpers/is-structural-document-change';

describe('isStructuralDocumentChange', () => {
    it('treats asymmetric mandala swaps as structural changes', () => {
        const state = defaultDocumentState();
        state.meta.mandalaV2.lastMutation = {
            actionType: 'document/mandala/swap',
            changedSections: ['2.3', '2.7'],
            structural: true,
        };

        expect(
            isStructuralDocumentChange(state, {
                type: 'document/mandala/swap',
                payload: {
                    sourceNodeId: 'n23',
                    targetNodeId: 'n27',
                },
            }),
        ).toBe(true);
    });

    it('keeps same-shape mandala swaps on the content-only path', () => {
        const state = defaultDocumentState();
        state.meta.mandalaV2.lastMutation = {
            actionType: 'document/mandala/swap',
            changedSections: ['2.3', '2.7'],
            structural: false,
        };

        expect(
            isStructuralDocumentChange(state, {
                type: 'document/mandala/swap',
                payload: {
                    sourceNodeId: 'n23',
                    targetNodeId: 'n27',
                },
            }),
        ).toBe(false);
    });
});
