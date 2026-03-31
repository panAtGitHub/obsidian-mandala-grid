import { describe, expect, test } from 'vitest';
import { resolveCompatibleMandalaMode } from 'src/mandala-interaction/helpers/resolve-compatible-mandala-mode';

describe('resolveCompatibleMandalaMode', () => {
    test('falls back from nx9 to 3x3 when no advanced mode is supported', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: 'nx9',
                canUse9x9Mode: false,
                canUseNx9Mode: false,
            }),
        ).toBe('3x3');
    });

    test('falls back from nx9 to 9x9 when nx9 is disabled but 9x9 is available', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: 'nx9',
                canUse9x9Mode: true,
                canUseNx9Mode: false,
            }),
        ).toBe('9x9');
    });

    test('falls back from 9x9 to 3x3 when 9x9 is disabled', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: '9x9',
                canUse9x9Mode: false,
                canUseNx9Mode: true,
            }),
        ).toBe('3x3');
    });

    test('does not change 3x3 or 9x9 modes', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: '3x3',
                canUse9x9Mode: false,
                canUseNx9Mode: false,
            }),
        ).toBeNull();
        expect(
            resolveCompatibleMandalaMode({
                currentMode: '9x9',
                canUse9x9Mode: true,
                canUseNx9Mode: false,
            }),
        ).toBeNull();
    });
});
