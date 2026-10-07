import { describe, expect, it } from 'vitest';
import { derivedOnAction } from 'src/shared/store/derived-on-action';
import { Store } from 'src/shared/store/store';

describe('shared/store/derived-on-action', () => {
    it('refreshes replacements without an action while filtering unrelated actions', () => {
        const source = new Store<
            { value: number },
            { type: 'tracked' | 'unrelated' }
        >({ value: 1 }, (state) => ({ value: state.value + 1 }));
        const mapped = derivedOnAction(source, (state) => state.value, [
            'tracked',
        ]);
        const values: number[] = [];
        const unsubscribe = mapped.subscribe((value) => values.push(value));
        values.length = 0;
        source.dispatch({ type: 'unrelated' });
        expect(values).toEqual([]);
        source.set({ value: 10 });
        source.update((state) => ({ value: state.value + 1 }));
        source.dispatch({ type: 'tracked' });
        expect(values).toEqual([10, 11, 12]);
        unsubscribe();
    });
});
