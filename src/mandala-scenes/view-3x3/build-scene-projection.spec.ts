import { describe, expect, it } from 'vitest';
import { buildThreeByThreeSceneProjection } from 'src/mandala-scenes/view-3x3/build-scene-projection';
import type { ThreeByThreeSceneProjectionProps } from 'src/mandala-scenes/shared/scene-projection';

const preparedProps: ThreeByThreeSceneProjectionProps = {
    cells: [],
    theme: '1',
    animateSwap: false,
    show3x3SubgridNavButtons: false,
    hasOpenOverlayModal: false,
    dayPlanEnabled: false,
    showDayPlanTodayButton: false,
    dayPlanTodayTargetSection: '1',
    activeCoreSection: null,
    todayButtonLabel: '',
    enterSubgridFromButton: () => undefined,
    exitSubgridFromButton: () => undefined,
    focusDayPlanTodayFromButton: () => undefined,
    getUpButtonLabel: () => '',
    getDownButtonLabel: () => '',
    onMobileCardDoubleClick: null,
};

const committedProps: ThreeByThreeSceneProjectionProps = {
    ...preparedProps,
    dayPlanTodayTargetSection: '2',
};

describe('build-three-by-three-scene-projection', () => {
    it('prefers committed props for steady 3x3 scenes', () => {
        const projection = buildThreeByThreeSceneProjection({
            sceneKey: {
                viewKind: '3x3',
                variant: 'default',
            },
            committedSceneKey: {
                viewKind: '3x3',
                variant: 'default',
            },
            preparedProps,
            committedProps,
        });

        expect(projection.rendererKind).toBe('3x3-layout');
        expect(projection.props.dayPlanTodayTargetSection).toBe('2');
    });

    it('uses prepared props while prewarming a different 3x3 variant', () => {
        const projection = buildThreeByThreeSceneProjection({
            sceneKey: {
                viewKind: '3x3',
                variant: 'day-plan',
            },
            committedSceneKey: {
                viewKind: '3x3',
                variant: 'default',
            },
            preparedProps,
            committedProps,
        });

        expect(projection.rendererKind).toBe('3x3-layout');
        expect(projection.props.dayPlanTodayTargetSection).toBe('1');
    });
});
