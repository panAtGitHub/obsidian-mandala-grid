import { describe, expect, it } from 'vitest';
import { buildWeekLegacySceneProjection } from 'src/mandala-scenes/view-7x9/build-legacy-scene-projection';

describe('build-week-legacy-scene-projection', () => {
    it('wraps week-7x9 scenes as a dedicated legacy projection', () => {
        expect(
            buildWeekLegacySceneProjection({
                viewKind: 'nx9',
                variant: 'week-7x9',
            }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            rendererKind: 'week-layout',
            props: {},
        });
    });
});
