const state = {
    n: 0,
    c: 0,
    s: 0,
};

export const __id__ = {
    root: () => 'r-',
    node: () => 'n-' + state.n++,
    column: () => 'c-' + state.c++,
    snapshot: () => 's-' + state.s++,
    reset: () => {
        state.n = 0;
        state.c = 0;
        state.s = 0;
    },
};
