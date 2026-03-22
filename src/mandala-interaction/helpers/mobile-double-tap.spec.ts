import { describe, expect, it } from 'vitest';
import { createMobileDoubleTapDetector } from 'src/mandala-interaction/helpers/mobile-double-tap';

describe('createMobileDoubleTapDetector', () => {
    it('returns false for the first tap', () => {
        const detector = createMobileDoubleTapDetector();
        expect(detector.registerTap({ x: 10, y: 10, key: '1', time: 1000 })).toBe(
            false,
        );
    });

    it('returns true for a valid double tap', () => {
        const detector = createMobileDoubleTapDetector();
        detector.registerTap({ x: 10, y: 10, key: '1', time: 1000 });
        expect(detector.registerTap({ x: 14, y: 12, key: '1', time: 1200 })).toBe(
            true,
        );
    });

    it('returns false when interval is below minimum', () => {
        const detector = createMobileDoubleTapDetector();
        detector.registerTap({ x: 10, y: 10, key: '1', time: 1000 });
        expect(detector.registerTap({ x: 10, y: 10, key: '1', time: 1050 })).toBe(
            false,
        );
    });

    it('returns false when interval exceeds window', () => {
        const detector = createMobileDoubleTapDetector();
        detector.registerTap({ x: 10, y: 10, key: '1', time: 1000 });
        expect(detector.registerTap({ x: 10, y: 10, key: '1', time: 2000 })).toBe(
            false,
        );
    });

    it('returns false when distance exceeds threshold', () => {
        const detector = createMobileDoubleTapDetector();
        detector.registerTap({ x: 10, y: 10, key: '1', time: 1000 });
        expect(detector.registerTap({ x: 80, y: 80, key: '1', time: 1200 })).toBe(
            false,
        );
    });

    it('returns false when key differs', () => {
        const detector = createMobileDoubleTapDetector();
        detector.registerTap({ x: 10, y: 10, key: '1', time: 1000 });
        expect(detector.registerTap({ x: 10, y: 10, key: '2', time: 1200 })).toBe(
            false,
        );
    });

    it('starts over after reset', () => {
        const detector = createMobileDoubleTapDetector();
        detector.registerTap({ x: 10, y: 10, key: '1', time: 1000 });
        detector.reset();
        expect(detector.registerTap({ x: 10, y: 10, key: '1', time: 1200 })).toBe(
            false,
        );
    });
});
