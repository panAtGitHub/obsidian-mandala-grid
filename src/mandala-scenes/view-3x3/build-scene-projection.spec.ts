import { describe, expect, it } from 'vitest';
import {
    buildThreeByThreeSceneProjection,
    buildThreeByThreeSceneProjectionProps,
} from 'src/mandala-scenes/view-3x3/build-scene-projection';
import type { ThreeByThreeSceneProjectionProps } from 'src/mandala-scenes/shared/scene-projection';

const preparedProps: ThreeByThreeSceneProjectionProps = {
    layoutKind: '3x3',
    output: {
        descriptors: [],
    },
    layoutMeta: {
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
    },
};

const committedProps: ThreeByThreeSceneProjectionProps = {
    ...preparedProps,
    layoutMeta: {
        ...preparedProps.layoutMeta,
        dayPlanTodayTargetSection: '2',
    },
};

describe('build-three-by-three-scene-projection', () => {
    it('builds three-by-three projection props with the standard today label', () => {
        const props = buildThreeByThreeSceneProjectionProps({
            cells: [],
            theme: '1',
            animateSwap: false,
            show3x3SubgridNavButtons: false,
            hasOpenOverlayModal: false,
            dayPlanEnabled: false,
            showDayPlanTodayButton: false,
            dayPlanTodayTargetSection: null,
            activeCoreSection: null,
            enterSubgridFromButton: () => undefined,
            exitSubgridFromButton: () => undefined,
            focusDayPlanTodayFromButton: () => undefined,
            onMobileCardDoubleClick: null,
            getUpButtonLabel: () => '',
            getDownButtonLabel: () => '',
        });

        expect(props.layoutMeta.todayButtonLabel).toBe('回到今天');
    });

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

        expect(projection.rendererKind).toBe('card-scene');
        if (
            projection.rendererKind !== 'card-scene' ||
            projection.props.layoutKind !== '3x3'
        ) {
            throw new Error('expected 3x3 projection');
        }
        expect(projection.props.layoutMeta.dayPlanTodayTargetSection).toBe('2');
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

        expect(projection.rendererKind).toBe('card-scene');
        if (
            projection.rendererKind !== 'card-scene' ||
            projection.props.layoutKind !== '3x3'
        ) {
            throw new Error('expected 3x3 projection');
        }
        expect(projection.props.layoutMeta.dayPlanTodayTargetSection).toBe('1');
    });
});
