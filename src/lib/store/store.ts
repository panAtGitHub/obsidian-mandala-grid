import { Unsubscriber, Updater, Writable } from 'svelte/store';

export const NO_UPDATE = Symbol('NO_UPDATE');

export type Subscriber<T, U> = (
    value: T,
    action?: U,
    firstRun?: boolean,
) => void;

export type Reducer<T, U, C> = (
    store: T,
    action: U,
    context: C,
) => T | typeof NO_UPDATE;

export type OnError<U> = (
    error: Error,
    location: 'reducer' | 'subscriber',
    action?: U,
) => void;

export class Store<T, U, C = never> implements Writable<T> {
    private value: T;
    private subscribers: Set<Subscriber<T, U>> = new Set();
    private isProcessing: boolean = false;
    private actionQueue: U[] = [];
    private context: C;
    constructor(
        initialValue: T,
        reducer?: Reducer<T, U, C>,
        onError?: OnError<U>,
        context?: C,
    ) {
        this.value = initialValue;
        if (reducer) this.reducer = reducer;
        if (onError) this.onError = onError;
        if (context) this.context = context;
    }

    getValue(): T {
        return this.value;
    }

    dispatch(action: U) {
        this.actionQueue.push(action);
        if (!this.isProcessing) {
            this.processActionQueue();
        }
    }

    set(value: T): void {
        this.value = value;
        this.notifySubscribers();
    }

    subscribe(run: Subscriber<T, U>): Unsubscriber {
        this.subscribers.add(run);
        try {
            run(this.value, undefined, true);
        } catch (error) {
            this.onError(error, 'subscriber');
        }

        return () => {
            this.subscribers.delete(run);
        };
    }

    update(updater: Updater<T>): void {
        this.value = updater(this.value);
        this.notifySubscribers();
    }

    private processActionQueue() {
        this.isProcessing = true;
        while (this.actionQueue.length > 0) {
            const action = this.actionQueue.shift();
            try {
                const newValue = this.reducer(
                    this.value,
                    action!,
                    this.context,
                );
                if (newValue !== NO_UPDATE) {
                    this.value = newValue;
                    this.notifySubscribers(action);
                }
            } catch (error) {
                this.onError(error, 'reducer', action);
            }
        }
        this.isProcessing = false;
    }

    private readonly reducer: Reducer<T, U, C> = () => this.value;
    private readonly onError: OnError<U> = (error) => console.error(error);

    private notifySubscribers(action?: U): void {
        for (const subscriber of this.subscribers) {
            try {
                subscriber(this.value, action);
            } catch (error) {
                this.onError(error, 'subscriber', action);
            }
        }
    }

    setContext = (context: C) => {
        this.context = context;
    };
}
