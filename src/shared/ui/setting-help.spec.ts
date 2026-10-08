// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { settingHelp } from 'src/shared/ui/setting-help';

const cleanups: Array<() => void> = [];
afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    document.body.replaceChildren();
});
const setup = () => {
    const node = document.createElement('span');
    document.body.append(node);
    const action = settingHelp(node, 'Only the fill changes.');
    cleanups.push(() => action.destroy());
    const button = node.querySelector('button')!;
    return { action, button };
};
describe('settingHelp', () => {
    it('shows on hover and focus, then closes when leaving', () => {
        const { button } = setup();
        button.dispatchEvent(new Event('mouseenter'));
        expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
            'Only the fill changes.',
        );
        button.dispatchEvent(new Event('mouseleave'));
        expect(document.querySelector('[role="tooltip"]')).toBeNull();
        button.focus();
        expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
        button.blur();
        expect(document.querySelector('[role="tooltip"]')).toBeNull();
    });
    it('pins on click without toggling its parent label and closes on outside click or Escape', () => {
        const { button } = setup();
        expect(
            button.dispatchEvent(
                new MouseEvent('click', { bubbles: true, cancelable: true }),
            ),
        ).toBe(false);
        button.dispatchEvent(new Event('mouseleave'));
        expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
        document.body.dispatchEvent(
            new Event('pointerdown', { bubbles: true }),
        );
        expect(document.querySelector('[role="tooltip"]')).toBeNull();
        button.click();
        document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        );
        expect(document.querySelector('[role="tooltip"]')).toBeNull();
        button.click();
        button.click();
        expect(document.querySelector('[role="tooltip"]')).toBeNull();
    });
    it('updates and removes the floating explanation when destroyed', () => {
        const { button, action } = setup();
        button.click();
        action.update('Updated explanation');
        expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
            'Updated explanation',
        );
        action.destroy();
        expect(document.querySelector('[role="tooltip"]')).toBeNull();
        expect(document.querySelector('button')).toBeNull();
    });
});
