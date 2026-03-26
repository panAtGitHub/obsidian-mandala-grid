import { describe, expect, it } from 'vitest';
import {
    getSceneKeyId,
    resolveSceneRendererKind,
    sceneKeyEquals,
} from 'src/mandala-scenes/shared/scene-projection';

describe('scene-projection', () => {
    it('resolves renderer kind from scene key', () => {
        expect(
            resolveSceneRendererKind({
                viewKind: '3x3',
                variant: 'default',
            }),
        ).toBe('3x3-layout');
        expect(
            resolveSceneRendererKind({
                viewKind: '9x9',
                variant: 'default',
            }),
        ).toBe('9x9-layout');
        expect(
            resolveSceneRendererKind({
                viewKind: 'nx9',
                variant: 'default',
            }),
        ).toBe('nx9-layout');
        expect(
            resolveSceneRendererKind({
                viewKind: 'nx9',
                variant: 'week-7x9',
            }),
        ).toBe('week-layout');
    });

    it('compares and serializes scene keys consistently', () => {
        const a = { viewKind: 'nx9', variant: 'week-7x9' } as const;
        const b = { viewKind: 'nx9', variant: 'week-7x9' } as const;
        const c = { viewKind: 'nx9', variant: 'default' } as const;

        expect(sceneKeyEquals(a, b)).toBe(true);
        expect(sceneKeyEquals(a, c)).toBe(false);
        expect(getSceneKeyId(a)).toBe('nx9:week-7x9');
    });
});
