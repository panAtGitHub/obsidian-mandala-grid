import { describe, expect, test } from 'vitest';
import { resolveCompatibleMandalaMode } from 'src/mandala-interaction/helpers/resolve-compatible-mandala-mode';

describe('resolveCompatibleMandalaMode', () => {
    test('keeps week plan mode when the file supports it', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: 'week-7x9',
                canUseWeekPlanMode: true,
                canUseNx9Mode: false,
            }),
        ).toBeNull();
    });

    test('falls back from week plan mode to nx9 for regular mandala files', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: 'week-7x9',
                canUseWeekPlanMode: false,
                canUseNx9Mode: true,
            }),
        ).toBe('nx9');
    });

    test('falls back from week plan mode to 3x3 when no advanced mode is supported', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: 'week-7x9',
                canUseWeekPlanMode: false,
                canUseNx9Mode: false,
            }),
        ).toBe('3x3');
    });

    test('falls back from nx9 to week plan mode for day plan files', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: 'nx9',
                canUseWeekPlanMode: true,
                canUseNx9Mode: false,
            }),
        ).toBe('week-7x9');
    });

    test('falls back from nx9 to 3x3 when no advanced mode is supported', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: 'nx9',
                canUseWeekPlanMode: false,
                canUseNx9Mode: false,
            }),
        ).toBe('3x3');
    });

    test('does not change 3x3 or 9x9 modes', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: '3x3',
                canUseWeekPlanMode: false,
                canUseNx9Mode: false,
            }),
        ).toBeNull();
        expect(
            resolveCompatibleMandalaMode({
                currentMode: '9x9',
                canUseWeekPlanMode: false,
                canUseNx9Mode: false,
            }),
        ).toBeNull();
    });
});
