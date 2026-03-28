import { describe, expect, it } from 'vitest';
import {
    buildThreeByThreeDayPlanSceneProjection,
    buildThreeByThreeDayPlanSceneProjectionProps,
} from 'src/mandala-scenes/view-3x3-day-plan/build-scene-projection';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';
import type { ThreeByThreeDayPlanSceneProjectionProps } from 'src/mandala-scenes/shared/scene-projection';

const threeByThreeGridStyle = resolveCardGridStyle({
    whiteThemeMode: false,
});
const themeSnapshot = {
    themeTone: 'light' as const,
    themeUnderlayColor: '#fff',
    activeThemeUnderlayColor: '#eee',
};

const preparedProps: ThreeByThreeDayPlanSceneProjectionProps = {
    layoutKind: '3x3-day-plan',
    output: {
        descriptors: [],
    },
    layoutMeta: {
        gridStyle: threeByThreeGridStyle,
        themeSnapshot,
        theme: '1',
        animateSwap: false,
        show3x3SubgridNavButtons: false,
        hasOpenOverlayModal: false,
        dayPlanEnabled: true,
        showDayPlanTodayButton: true,
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

const committedProps: ThreeByThreeDayPlanSceneProjectionProps = {
    ...preparedProps,
    layoutMeta: {
        ...preparedProps.layoutMeta,
        dayPlanTodayTargetSection: '2',
    },
};

describe('build-three-by-three-day-plan-scene-projection', () => {
    it('builds day-plan projection props with the standard today label', () => {
        const props = buildThreeByThreeDayPlanSceneProjectionProps({
            cells: [],
            gridStyle: threeByThreeGridStyle,
            themeSnapshot,
            theme: '1',
            animateSwap: false,
            show3x3SubgridNavButtons: false,
            hasOpenOverlayModal: false,
            dayPlanEnabled: true,
            showDayPlanTodayButton: true,
            dayPlanTodayTargetSection: null,
            activeCoreSection: null,
            enterSubgridFromButton: () => undefined,
            exitSubgridFromButton: () => undefined,
            focusDayPlanTodayFromButton: () => undefined,
            onMobileCardDoubleClick: null,
            getUpButtonLabel: () => '',
            getDownButtonLabel: () => '',
        });

        expect(props.layoutKind).toBe('3x3-day-plan');
        expect(props.layoutMeta.todayButtonLabel).toBe('回到今天');
    });

    it('prefers committed props for steady 3x3 day-plan scenes', () => {
        const projection = buildThreeByThreeDayPlanSceneProjection({
            sceneKey: {
                viewKind: '3x3',
                variant: 'day-plan',
            },
            committedSceneKey: {
                viewKind: '3x3',
                variant: 'day-plan',
            },
            preparedProps,
            committedProps,
        });

        expect(projection.rendererKind).toBe('card-scene');
        if (
            projection.rendererKind !== 'card-scene' ||
            projection.props.layoutKind !== '3x3-day-plan'
        ) {
            throw new Error('expected 3x3 day-plan projection');
        }
        expect(projection.props.layoutMeta.dayPlanTodayTargetSection).toBe('2');
    });

    it('uses prepared props while prewarming a different 3x3 variant', () => {
        const projection = buildThreeByThreeDayPlanSceneProjection({
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
            projection.props.layoutKind !== '3x3-day-plan'
        ) {
            throw new Error('expected 3x3 day-plan projection');
        }
        expect(projection.props.layoutMeta.dayPlanTodayTargetSection).toBe('1');
    });
});
