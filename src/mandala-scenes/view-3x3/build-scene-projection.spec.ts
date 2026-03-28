import { describe, expect, it } from 'vitest';
import {
    buildThreeByThreeSceneProjection,
    buildThreeByThreeSceneProjectionProps,
} from 'src/mandala-scenes/view-3x3/build-scene-projection';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';
import type { ThreeByThreeSceneProjectionProps } from 'src/mandala-scenes/shared/scene-projection';

const threeByThreeGridStyle = resolveCardGridStyle({
    whiteThemeMode: false,
});
const themeSnapshot = {
    themeTone: 'light' as const,
    themeUnderlayColor: '#fff',
    activeThemeUnderlayColor: '#eee',
};

const preparedProps: ThreeByThreeSceneProjectionProps = {
    layoutKind: '3x3',
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
        enterSubgridFromButton: () => undefined,
        exitSubgridFromButton: () => undefined,
        getUpButtonLabel: () => '',
        getDownButtonLabel: () => '',
        onMobileCardDoubleClick: null,
    },
};

const committedProps: ThreeByThreeSceneProjectionProps = {
    ...preparedProps,
    layoutMeta: {
        ...preparedProps.layoutMeta,
        theme: '2',
    },
};

describe('build-three-by-three-scene-projection', () => {
    it('builds base three-by-three projection props', () => {
        const props = buildThreeByThreeSceneProjectionProps({
            cells: [],
            gridStyle: threeByThreeGridStyle,
            themeSnapshot,
            theme: '1',
            animateSwap: false,
            show3x3SubgridNavButtons: false,
            hasOpenOverlayModal: false,
            enterSubgridFromButton: () => undefined,
            exitSubgridFromButton: () => undefined,
            onMobileCardDoubleClick: null,
            getUpButtonLabel: () => '',
            getDownButtonLabel: () => '',
        });

        expect(props.layoutKind).toBe('3x3');
        expect(
            props.layoutMeta.gridStyle.cellDisplayPolicy.inactiveSurfaceMode,
        ).toBe('detached');
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
        expect(projection.props.layoutMeta.theme).toBe('2');
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
        expect(projection.props.layoutMeta.theme).toBe('1');
    });
});
