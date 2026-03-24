import { describe, expect, it } from 'vitest';
import {
    getMandalaActiveCell9x9,
    getMandalaActiveCellNx9,
    getMandalaActiveCellWeek7x9,
    getMandalaWeekAnchorDate,
} from 'src/mandala-scenes/shared/scene-runtime';

describe('scene-runtime', () => {
    it('falls back to null for partial scene state shapes', () => {
        const viewState = {
            ui: {
                mandala: {
                    sceneState: {
                        nx9: {
                            weekPlan: {
                                anchorDate: '2026-03-24',
                            },
                        },
                    },
                },
            },
        } as never;

        expect(getMandalaActiveCell9x9(viewState)).toBe(null);
        expect(getMandalaActiveCellNx9(viewState)).toBe(null);
        expect(getMandalaActiveCellWeek7x9(viewState)).toBe(null);
        expect(getMandalaWeekAnchorDate(viewState)).toBe('2026-03-24');
    });
});
