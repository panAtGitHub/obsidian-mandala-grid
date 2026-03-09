import { describe, expect, test } from 'vitest';
import { updateCheckbox } from 'src/stores/view/subscriptions/effects/checkbox-listener/helpers/update-checkbox/update-checkbox';
import { updateTaskLine } from 'src/stores/view/subscriptions/effects/checkbox-listener/helpers/update-checkbox/update-task-line';

describe('updateTaskLine', () => {
    test('updates a top-level task', () => {
        expect(updateTaskLine('- [ ] Task', true)).toBe('- [x] Task');
    });

    test('updates an indented task without removing indentation', () => {
        expect(updateTaskLine('    - [ ] Nested task', true)).toBe(
            '    - [x] Nested task',
        );
    });
});

describe('updateCheckbox', () => {
    test('updates the matching nested task line', () => {
        const content = [
            '- Parent item',
            '    - [ ] First nested task',
            '    - [ ] Second nested task',
        ].join('\n');

        expect(updateCheckbox(1, content, true)).toEqual({
            task: 'Second nested task',
            content: [
                '- Parent item',
                '    - [ ] First nested task',
                '    - [x] Second nested task',
            ].join('\n'),
        });
    });
});
