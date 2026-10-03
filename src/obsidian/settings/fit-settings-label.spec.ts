/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fitSettingsLabel } from './fit-settings-label';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('fitSettingsLabel', () => {
    const setup = (contentWidth: number) => {
        let resize = () => {};
        const disconnect = vi.fn();
        vi.stubGlobal(
            'ResizeObserver',
            class {
                constructor(callback: () => void) {
                    resize = callback;
                }
                observe() {}
                disconnect = disconnect;
            },
        );
        const label = document.createElement('span');
        const card = document.createElement('div');
        card.className = 'mandala-settings-card';
        card.appendChild(label);
        label.style.fontSize = '20px';
        Object.defineProperty(label, 'clientWidth', {
            configurable: true,
            value: 100,
        });
        Object.defineProperty(label, 'scrollWidth', { value: contentWidth });
        const cleanup = fitSettingsLabel(label);
        return { label, card, cleanup, disconnect, resize: () => resize() };
    };

    it('keeps the default font when text fits', () => {
        const { label, cleanup } = setup(90);
        expect(label.style.fontSize).toBe('20px');
        cleanup();
    });
    it('shrinks overflowing text by no more than 15 percent', () => {
        const { label, cleanup } = setup(150);
        expect(label.style.fontSize).toBe('17px');
        cleanup();
    });
    it('shrinks only as much as necessary and restores it after widening', () => {
        const { label, cleanup, resize, disconnect } = setup(110);
        expect(Number.parseFloat(label.style.fontSize)).toBeCloseTo(20 / 1.1);
        Object.defineProperty(label, 'clientWidth', { value: 120 });
        resize();
        expect(label.style.fontSize).toBe('20px');
        cleanup();
        expect(disconnect).toHaveBeenCalledOnce();
    });
    it('waits until a collapsed label has a measurable width', () => {
        const { label, cleanup, resize } = setup(110);
        Object.defineProperty(label, 'clientWidth', { value: 0 });
        resize();
        expect(label.style.fontSize).toBe('20px');
        cleanup();
    });
    it('fits immediately when opening a card and removes its click listener', () => {
        const { label, card, cleanup, resize } = setup(110);
        Object.defineProperty(label, 'clientWidth', { value: 0 });
        resize();
        Object.defineProperty(label, 'clientWidth', { value: 100 });
        card.click();
        expect(Number.parseFloat(label.style.fontSize)).toBeCloseTo(20 / 1.1);
        cleanup();
        label.style.fontSize = '20px';
        card.click();
        expect(label.style.fontSize).toBe('20px');
    });
});
