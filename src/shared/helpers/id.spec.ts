import { describe, expect, it } from 'vitest';
import { id, isId } from 'src/shared/helpers/id';

describe('internal IDs', () => {
    it.each([
        ['rootNode', 'r'],
        ['node', 'n'],
        ['column', 'c'],
        ['snapshot', 's'],
        ['view', 'v'],
        ['canvas', 'canvas-'],
        ['styleRule', 'sr'],
    ] as const)(
        'preserves the %s prefix and eight-character suffix',
        (kind, prefix) => {
            const generated = id[kind]();

            expect(generated.startsWith(prefix)).toBe(true);
            expect(generated.slice(prefix.length)).toMatch(
                /^[A-Za-z0-9_-]{8}$/,
            );
        },
    );

    it('recognizes both existing and newly generated node IDs', () => {
        expect(isId.node('nAb12_-Xy')).toBe(true);
        expect(isId.node(id.node())).toBe(true);
        expect(isId.node(id.column())).toBe(false);
        expect(isId.node('nAb12')).toBe(false);
    });
});
