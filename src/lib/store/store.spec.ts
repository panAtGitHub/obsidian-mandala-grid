import { describe, expect, test } from 'vitest';
import { NO_UPDATE, Store } from 'src/lib/store/store';

type Action = { type: 'add'; value: number } | { type: 'noop' };

const reducer = (state: number, action: Action) => {
    if (action.type === 'noop') return NO_UPDATE;
    return state + action.value;
};

describe('Store.batch', () => {
    test('defers reducer work until batch exits', () => {
        const store = new Store<number, Action>(0, reducer);
        const notifications: Array<{ value: number; action?: Action }> = [];
        store.subscribe((value, action, initialRun) => {
            if (initialRun) return;
            notifications.push({ value, action });
        });

        store.batch(() => {
            store.dispatch({ type: 'add', value: 1 });
            store.dispatch({ type: 'add', value: 2 });
            expect(store.getValue()).toBe(0);
        });

        expect(store.getValue()).toBe(3);
        expect(notifications).toEqual([
            { value: 1, action: { type: 'add', value: 1 } },
            { value: 3, action: { type: 'add', value: 2 } },
        ]);
    });

    test('supports nested batches and ignores NO_UPDATE actions', () => {
        const store = new Store<number, Action>(0, reducer);
        const seenValues: number[] = [];
        store.subscribe((value, _action, initialRun) => {
            if (initialRun) return;
            seenValues.push(value);
        });

        store.batch(() => {
            store.dispatch({ type: 'add', value: 1 });
            store.batch(() => {
                store.dispatch({ type: 'noop' });
                store.dispatch({ type: 'add', value: 3 });
            });
            expect(store.getValue()).toBe(0);
        });

        expect(store.getValue()).toBe(4);
        expect(seenValues).toEqual([1, 4]);
    });
});
