import { describe, expect, test } from 'vitest';
import type { MandalaView } from 'src/view/view';
import {
    canEnterThreeByThreeTheme,
    canUseThreeByThreeThemeAsCenter,
    resolveNearestThreeByThreeCenterTheme,
    resolveThreeByThreeMaxDepth,
} from 'src/mandala-scenes/view-3x3/subgrid-depth';

const mockView = (props: {
    subgridMaxDepth: number | 'unlimited';
    enable9x9View: boolean;
}) =>
    ({
        getEffectiveMandalaSettings: () => ({
            view: {
                coreSectionMax: 'unlimited',
                subgridMaxDepth: props.subgridMaxDepth,
                enable9x9View: props.enable9x9View,
                enableNx9View: true,
            },
            general: {
                dayPlanEnabled: true,
                weekPlanEnabled: true,
                weekPlanCompactMode: true,
                weekStart: 'monday',
                dayPlanDateHeadingFormat: 'zh-short',
                dayPlanDateHeadingCustomTemplate: '## {date} {cn}',
            },
        }),
    }) as unknown as MandalaView;

describe('view-3x3/subgrid-depth', () => {
    test('uses infinite depth when infinite nesting is enabled', () => {
        expect(
            resolveThreeByThreeMaxDepth(
                mockView({
                    subgridMaxDepth: 'unlimited',
                    enable9x9View: false,
                }),
            ),
        ).toBe(Number.POSITIVE_INFINITY);
    });

    test('limits to 1.1~1.8 when max depth is 2', () => {
        const view = mockView({
            subgridMaxDepth: 2,
            enable9x9View: false,
        });
        expect(resolveThreeByThreeMaxDepth(view)).toBe(2);
        expect(canUseThreeByThreeThemeAsCenter(view, '1.1')).toBe(false);
        expect(canEnterThreeByThreeTheme(view, '2')).toBe(true);
        expect(canEnterThreeByThreeTheme(view, '1.1.1')).toBe(false);
    });

    test('keeps visible depth and center depth separate when max depth is 3', () => {
        const view = mockView({
            subgridMaxDepth: 3,
            enable9x9View: true,
        });
        expect(resolveThreeByThreeMaxDepth(view)).toBe(3);
        expect(canUseThreeByThreeThemeAsCenter(view, '1.1.1')).toBe(false);
        expect(canEnterThreeByThreeTheme(view, '1.1.1.1')).toBe(false);
        expect(resolveNearestThreeByThreeCenterTheme(view, '1.2.2')).toBe(
            '1.2',
        );
        expect(resolveNearestThreeByThreeCenterTheme(view, '1.2.2.3')).toBe(
            '1.2',
        );
    });
});
