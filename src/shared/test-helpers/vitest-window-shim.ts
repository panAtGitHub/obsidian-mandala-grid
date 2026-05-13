const globalScope = globalThis as typeof globalThis & {
    window?: typeof globalThis;
    activeWindow?: typeof globalThis;
    activeDocument?: Document;
};

if (!globalScope.window) {
    globalScope.window = globalThis as unknown as typeof window;
}

if (!globalScope.activeWindow) {
    globalScope.activeWindow = globalScope.window;
}

if (!globalScope.activeDocument && typeof document !== 'undefined') {
    globalScope.activeDocument = document;
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
