import { describe, expect, it, vi } from 'vitest';
import { derived, derivedEq } from 'src/shared/store/derived';
import { Store } from 'src/shared/store/store';

type TestAction = { type: 'test' };

describe('shared/store/derived', () => {
    it.each(['derived', 'derivedEq'] as const)(
        '%s refreshes after snapshot replacement and update without an action',
        (kind) => {
            const source = new Store<{ value: number }, TestAction>({
                value: 1,
            });
            const mapper = (state: { value: number }) => state.value;
            const mapped =
                kind === 'derived'
                    ? derived(source, mapper)
                    : derivedEq(source, mapper, (a, b) => a === b);
            const values: number[] = [];
            const unsubscribe = mapped.subscribe((value) => values.push(value));
            source.set({ value: 2 });
            source.update((state) => ({ value: state.value + 1 }));
            expect(values).toEqual([1, 2, 3]);
            unsubscribe();
        },
    );

    it('re-emits initial value after all subscribers unmount and remount', () => {
        const source = new Store<{ value: number }, TestAction>({ value: 1 });
        const mapped = derived(source, (state) => state.value);

        const firstRun = vi.fn();
        const unSubFirst = mapped.subscribe((value) => {
            firstRun(value);
        });
        expect(firstRun).toHaveBeenCalledWith(1);

        unSubFirst();

        const secondRun = vi.fn();
        mapped.subscribe((value) => {
            secondRun(value);
        });
        expect(secondRun).toHaveBeenCalledWith(1);
    });

    it('re-emits initial value for derivedEq after remount with stable source reference', () => {
        const stableState = { value: 1 };
        const source = new Store<{ value: number }, TestAction>(stableState);
        const mapped = derivedEq(
            source,
            (state) => ({ value: state.value }),
            (a, b) => a.value === b.value,
        );

        const firstRun = vi.fn();
        const unSubFirst = mapped.subscribe((value) => {
            firstRun(value.value);
        });
        expect(firstRun).toHaveBeenCalledWith(1);

        unSubFirst();

        const secondRun = vi.fn();
        mapped.subscribe((value) => {
            secondRun(value.value);
        });
        expect(secondRun).toHaveBeenCalledWith(1);
    });
});
