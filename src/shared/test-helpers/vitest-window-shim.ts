const globalScope = globalThis as typeof window & {
    window?: typeof window;
    activeWindow?: typeof window;
    activeDocument?: Document;
};

if (!Object.getOwnPropertyDescriptor(globalScope, 'window')) {
    Object.defineProperty(globalScope, 'window', {
        configurable: true,
        enumerable: false,
        get() {
            return globalScope as unknown as typeof window;
        },
    });
}

if (!Object.getOwnPropertyDescriptor(globalScope, 'activeWindow')) {
    Object.defineProperty(globalScope, 'activeWindow', {
        configurable: true,
        enumerable: false,
        get() {
            return globalScope.window;
        },
    });
}

if (!Object.getOwnPropertyDescriptor(globalScope, 'activeDocument')) {
    Object.defineProperty(globalScope, 'activeDocument', {
        configurable: true,
        enumerable: false,
        get() {
            return globalScope.window?.document;
        },
    });
}

const patchInstanceOf = <
    T extends {
        prototype: object;
    },
>(
    ctor: T | undefined,
) => {
    if (!ctor) return;
    const prototype = ctor.prototype as Record<string, unknown>;
    if (typeof prototype['instanceOf'] === 'function') return;
    prototype['instanceOf'] = function (
        this: unknown,
        type: new (...args: unknown[]) => unknown,
    ) {
        return this instanceof type;
    };
};

patchInstanceOf(typeof Node !== 'undefined' ? Node : undefined);
patchInstanceOf(typeof Event !== 'undefined' ? Event : undefined);
