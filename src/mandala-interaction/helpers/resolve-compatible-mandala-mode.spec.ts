import { describe, expect, test } from 'vitest';
import { resolveCompatibleMandalaMode } from 'src/mandala-interaction/helpers/resolve-compatible-mandala-mode';

describe('resolveCompatibleMandalaMode', () => {
    test('falls back from nx9 to 3x3 when no advanced mode is supported', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: 'nx9',
                canUseNx9Mode: false,
            }),
        ).toBe('3x3');
    });

    test('does not change 3x3 or 9x9 modes', () => {
        expect(
            resolveCompatibleMandalaMode({
                currentMode: '3x3',
                canUseNx9Mode: false,
            }),
        ).toBeNull();
        expect(
            resolveCompatibleMandalaMode({
                currentMode: '9x9',
                canUseNx9Mode: false,
            }),
        ).toBeNull();
    });
});
