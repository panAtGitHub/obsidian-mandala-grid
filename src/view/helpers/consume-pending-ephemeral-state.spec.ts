import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    consumePendingEphemeralState,
    getEphemeralStateLine,
} from 'src/view/helpers/consume-pending-ephemeral-state';
import { selectCard } from 'src/view/helpers/handle-links/helpers/select-card';

afterEach(() => {
    vi.useRealTimers();
});

describe('consumePendingEphemeralState', () => {
    it.each([-1, 1.5, NaN, Infinity, '12', undefined])(
        'rejects an invalid line: %s',
        (line) => {
            expect(getEphemeralStateLine({ line })).toBeNull();
        },
    );

    it('accepts a jump to the first line', () => {
        const state = { line: 0 };
        expect(getEphemeralStateLine(state)).toBe(0);
        expect(consumePendingEphemeralState(state, state)).toEqual({
            consumed: true,
            nextState: null,
        });
    });

    it('preserves a newer request even when it has the same line', () => {
        const previous = { line: 12 };
        const next = { line: 12 };
        expect(consumePendingEphemeralState(next, previous)).toEqual({
            consumed: false,
            nextState: next,
        });
    });

    it('does not consume a matching state with no line', () => {
        const state = { subpath: '#标题' };
        expect(consumePendingEphemeralState(state, state)).toEqual({
            consumed: false,
            nextState: state,
        });
    });

    it('consumes only the explicit line already handled by bootstrap', () => {
        const pendingState = { line: 12 };

        expect(getEphemeralStateLine(pendingState)).toBe(12);
        expect(
            consumePendingEphemeralState(pendingState, pendingState),
        ).toEqual({ consumed: true, nextState: null });
    });

    it('keeps other ephemeral fields after consuming the line', () => {
        const pendingState = {
            line: 12,
            subpath: '#继续处理',
        };

        expect(
            consumePendingEphemeralState(pendingState, pendingState),
        ).toEqual({
            consumed: true,
            nextState: { subpath: '#继续处理' },
        });
        expect(pendingState).toEqual({ line: 12, subpath: '#继续处理' });
    });

    it('replays an unconsumed line jump', () => {
        const pendingState = { line: 12 };
        const differentState = { line: 20 };

        expect(
            consumePendingEphemeralState(pendingState, differentState),
        ).toEqual({ consumed: false, nextState: pendingState });
    });

    it('does not consume persisted-style state without a matching bootstrap state', () => {
        const pendingState = { subpath: '#标题' };

        expect(consumePendingEphemeralState(pendingState, null)).toEqual({
            consumed: false,
            nextState: pendingState,
        });
        expect(getEphemeralStateLine(pendingState)).toBeNull();
    });

    it('leaves the user selection as the final write after bootstrap consumes A', async () => {
        vi.useFakeTimers();
        const pendingState = { line: 12 };
        const consumption = consumePendingEphemeralState(
            pendingState,
            pendingState,
        );
        const selected: string[] = [];
        const view = {
            documentStore: {
                getValue: () => ({
                    document: {
                        columns: [
                            {
                                id: 'column-1',
                                groups: [{ parentId: '', nodes: ['A', 'B'] }],
                            },
                        ],
                    },
                }),
            },
            viewStore: {
                dispatch: (action: { payload: { id: string } }) => {
                    selected.push(action.payload.id);
                },
            },
        };

        if (consumption.nextState) {
            void selectCard(view as never, 'A');
        }
        const userSelection = selectCard(view as never, 'B');
        await vi.advanceTimersByTimeAsync(16);
        await userSelection;

        expect(selected).toEqual(['B']);
    });
});
