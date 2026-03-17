import { describe, expect, test } from 'vitest';
import { defaultViewState } from 'src/stores/view/default-view-state';
import { viewReducer } from 'src/stores/view/view-reducer';
import { MandalaGridDocument } from 'src/stores/document/document-state-type';

describe('viewReducer', () => {
    test('stores mandala mode in view-local state', () => {
        const state = defaultViewState('3x3');

        viewReducer(
            state,
            {
                type: 'view/mandala/mode/set',
                payload: { mode: 'nx9' },
            },
            {} as MandalaGridDocument,
        );

        expect(state.ui.mandala.mode).toBe('nx9');
    });
});
