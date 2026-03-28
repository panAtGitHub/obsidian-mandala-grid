import { describe, expect, test, vi } from 'vitest';
import { defaultViewState } from 'src/stores/view/default-view-state';
import { viewReducer } from 'src/stores/view/view-reducer';
import { MandalaGridDocument } from 'src/mandala-document/state/document-state-type';

vi.mock('obsidian', () => ({
    Platform: {
        isMobile: false,
    },
}));

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

    test('stores detail sidebar visibility in view-local state', () => {
        const state = defaultViewState('3x3', false);

        viewReducer(
            state,
            {
                type: 'view/mandala/detail-sidebar/set',
                payload: { open: true },
            },
            {} as MandalaGridDocument,
        );

        expect(state.ui.mandala.showDetailSidebar).toBe(true);
    });

    test('skips redundant 9x9 and week cell updates', () => {
        const state = defaultViewState('3x3');
        state.ui.mandala.sceneState.nineByNine.activeCell = { row: 1, col: 2 };
        state.ui.mandala.sceneState.nx9.weekPlan.activeCell = { row: 3, col: 4 };
        const previousMandalaState = state.ui.mandala;

        viewReducer(
            state,
            {
                type: 'view/mandala/active-cell/set',
                payload: { cell: { row: 1, col: 2 } },
            },
            {} as MandalaGridDocument,
        );
        viewReducer(
            state,
            {
                type: 'view/mandala/week-active-cell/set',
                payload: { cell: { row: 3, col: 4 } },
            },
            {} as MandalaGridDocument,
        );

        expect(state.ui.mandala).toBe(previousMandalaState);
        expect(state.ui.mandala.focusTarget).toBeNull();
    });

    test('skips redundant nx9 active cell updates', () => {
        const state = defaultViewState('3x3');
        state.ui.mandala.sceneState.nx9.activeCell = { row: 5, col: 6, page: 2 };
        const previousMandalaState = state.ui.mandala;

        viewReducer(
            state,
            {
                type: 'view/mandala/nx9-active-cell/set',
                payload: { cell: { row: 5, col: 6, page: 2 } },
            },
            {} as MandalaGridDocument,
        );

        expect(state.ui.mandala).toBe(previousMandalaState);
        expect(state.ui.mandala.focusTarget).toBeNull();
    });
});
