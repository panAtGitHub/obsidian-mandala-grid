import { describe, expect, it } from 'vitest';
import {
    buildWeekSceneProjection,
    buildWeekSceneProjectionProps,
} from 'src/mandala-scenes/view-7x9/build-scene-projection';

describe('build-week-scene-projection', () => {
    it('builds week projection props from resolved rows', () => {
        expect(
            buildWeekSceneProjectionProps({
                rows: [{ date: '2026-01-01', coreSection: '1', inPlanYear: true }],
            }),
        ).toEqual({
            rows: [{ date: '2026-01-01', coreSection: '1', inPlanYear: true }],
        });
    });

    it('wraps week variants as a dedicated projection', () => {
        expect(
            buildWeekSceneProjection({
                viewKind: 'nx9',
                variant: 'week-7x9',
            }, { rows: [] }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            rendererKind: 'week-layout',
            props: { rows: [] },
        });
    });
});
