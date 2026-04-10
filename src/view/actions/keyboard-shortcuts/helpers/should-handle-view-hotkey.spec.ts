// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { shouldHandleViewHotkey } from 'src/view/actions/keyboard-shortcuts/helpers/should-handle-view-hotkey';

const createKeyboardEvent = (target: EventTarget) => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    Object.defineProperty(event, 'target', { value: target });
    return event;
};

describe('shouldHandleViewHotkey', () => {
    it('returns false for input targets', () => {
        const input = document.createElement('input');

        expect(shouldHandleViewHotkey(createKeyboardEvent(input))).toBe(false);
    });

    it('returns false for contenteditable targets', () => {
        const editable = document.createElement('div');
        editable.setAttribute('contenteditable', 'true');

        expect(shouldHandleViewHotkey(createKeyboardEvent(editable))).toBe(false);
    });

    it('returns false for search results descendants', () => {
        const list = document.createElement('div');
        list.className = 'mandala-search-results';
        const item = document.createElement('button');
        list.appendChild(item);

        expect(shouldHandleViewHotkey(createKeyboardEvent(item))).toBe(false);
    });

    it('returns true for regular view targets', () => {
        const div = document.createElement('div');

        expect(shouldHandleViewHotkey(createKeyboardEvent(div))).toBe(true);
    });

    it('falls back to document.activeElement when event target is not an element', () => {
        const list = document.createElement('div');
        list.className = 'mandala-search-results';
        list.tabIndex = -1;
        document.body.appendChild(list);
        list.focus();

        const event = new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            bubbles: true,
        });
        Object.defineProperty(event, 'target', { value: window });

        expect(shouldHandleViewHotkey(event)).toBe(false);

        list.remove();
    });

    it('returns false when search results keyboard navigation mode is active', () => {
        const list = document.createElement('div');
        list.className = 'mandala-search-results';
        list.dataset.keyboardNavigationActive = 'true';
        document.body.appendChild(list);

        const event = new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            bubbles: true,
        });
        Object.defineProperty(event, 'target', { value: document.body });

        expect(shouldHandleViewHotkey(event)).toBe(false);

        list.remove();
    });
});
