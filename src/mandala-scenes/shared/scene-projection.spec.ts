import { describe, expect, it } from 'vitest';
import {
    getSceneKeyId,
    resolveSceneRendererKind,
    sceneKeyEquals,
    shouldUseCommittedSceneProjection,
} from 'src/mandala-scenes/shared/scene-projection';

describe('scene-projection', () => {
    it('resolves renderer kind from scene key', () => {
        expect(
            resolveSceneRendererKind({
                viewKind: '3x3',
                variant: 'default',
            }),
        ).toBe('card-scene');
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
        ).toBe('card-scene');
        expect(
            resolveSceneRendererKind({
                viewKind: 'nx9',
                variant: 'week-7x9',
            }),
        ).toBe('card-scene');
    });

    it('compares and serializes scene keys consistently', () => {
        const a = { viewKind: 'nx9', variant: 'week-7x9' } as const;
        const b = { viewKind: 'nx9', variant: 'week-7x9' } as const;
        const c = { viewKind: 'nx9', variant: 'default' } as const;

        expect(sceneKeyEquals(a, b)).toBe(true);
        expect(sceneKeyEquals(a, c)).toBe(false);
        expect(getSceneKeyId(a)).toBe('nx9:week-7x9');
    });

    it('uses committed projection only for steady 3x3 scenes', () => {
        expect(
            shouldUseCommittedSceneProjection(
                { viewKind: '3x3', variant: 'default' },
                { viewKind: '3x3', variant: 'default' },
            ),
        ).toBe(true);
        expect(
            shouldUseCommittedSceneProjection(
                { viewKind: '3x3', variant: 'day-plan' },
                { viewKind: '3x3', variant: 'default' },
            ),
        ).toBe(false);
        expect(
            shouldUseCommittedSceneProjection(
                { viewKind: 'nx9', variant: 'default' },
                { viewKind: 'nx9', variant: 'default' },
            ),
        ).toBe(false);
    });
});
