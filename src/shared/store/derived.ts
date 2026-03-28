import { Subscriber } from 'src/shared/store/store';
import { Unsubscriber } from 'svelte/store';
import { Derivable } from './derived-on-action';

export const derived = <Value, Action extends { type: string }, DerivedValue>(
    source: Derivable<Value, Action>,
    mapper: (value: Value, action?: Action) => DerivedValue,
): Derivable<DerivedValue, Action> => {
    const subscribers: Set<Subscriber<DerivedValue, Action>> = new Set();
    let derivedValue: DerivedValue;
    let hasValue = false;
    let unsubFromSource: Unsubscriber | null = null;
    return {
        subscribe: (run) => {
            subscribers.add(run);
            if (!unsubFromSource) {
                unsubFromSource = source.subscribe(
                    (value, action, initialRun) => {
                        if (action || initialRun) {
                            const newValue = mapper(value, action);
                            if (!hasValue || newValue !== derivedValue) {
                                derivedValue = newValue;
                                hasValue = true;
                                for (const sub of subscribers) {
                                    sub(derivedValue, action, initialRun);
                                }
                            }
                        }
                    },
                );
            } else if (hasValue) {
                run(derivedValue, undefined, true);
            }

            return () => {
                subscribers.delete(run);
                if (unsubFromSource && subscribers.size === 0) {
                    unsubFromSource();
                    unsubFromSource = null;
                    hasValue = false;
                }
            };
        },
    };
};

export const derivedEq = <Value, Action extends { type: string }, DerivedValue>(
    source: Derivable<Value, Action>,
    mapper: (value: Value, action?: Action) => DerivedValue,
    isEqual: (a: DerivedValue, b: DerivedValue) => boolean,
): Derivable<DerivedValue, Action> => {
    const subscribers: Set<Subscriber<DerivedValue, Action>> = new Set();
    let derivedValue: DerivedValue;
    let hasValue = false;
    let unsubFromSource: Unsubscriber | null = null;
    return {
        subscribe: (run) => {
            subscribers.add(run);
            if (!unsubFromSource) {
                unsubFromSource = source.subscribe(
                    (value, action, initialRun) => {
                        if (action || initialRun) {
                            const newValue = mapper(value, action);
                            if (!hasValue || !isEqual(newValue, derivedValue)) {
                                derivedValue = newValue;
                                hasValue = true;
                                for (const sub of subscribers) {
                                    sub(derivedValue, action, initialRun);
                                }
                            }
                        }
                    },
                );
            } else if (hasValue) {
                run(derivedValue, undefined, true);
            }

            return () => {
                subscribers.delete(run);
                if (unsubFromSource && subscribers.size === 0) {
                    unsubFromSource();
                    unsubFromSource = null;
                    hasValue = false;
                }
            };
        },
    };
};
