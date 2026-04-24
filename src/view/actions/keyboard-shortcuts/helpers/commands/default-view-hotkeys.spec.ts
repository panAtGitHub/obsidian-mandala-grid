import { beforeEach, describe, expect, it, vi } from 'vitest';

import { lang } from 'src/lang/lang';
import { hotkeysLang } from 'src/lang/hotkeys-lang';
import {
    defaultViewHotkeys,
    StatefulViewCommand,
    StatefulViewHotkey,
} from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
import {
    updateViewHotkeysDictionary,
    viewHotkeys,
} from 'src/view/actions/keyboard-shortcuts/helpers/commands/update-view-hotkeys-dictionary';
import { hotkeyToString } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/hotkey-to-string';

describe('defaultViewHotkeys shared navigation commands', () => {
    beforeEach(() => {
        viewHotkeys.current = {};
    });

    it('uses generic hotkey labels while keeping the shared command ids', () => {
        expect(hotkeysLang.jump_core_prev).toBe(
            lang.hk_navigate_prev_view_unit,
        );
        expect(hotkeysLang.jump_core_next).toBe(
            lang.hk_navigate_next_view_unit,
        );

        const commands = defaultViewHotkeys();
        expect(
            commands.some((command) => command.name === 'jump_core_prev'),
        ).toBe(true);
        expect(
            commands.some((command) => command.name === 'jump_core_next'),
        ).toBe(true);
    });

    it('keeps custom bindings working through the stable shared command id', () => {
        const command = defaultViewHotkeys().find(
            (item) => item.name === 'jump_core_next',
        );
        expect(command).toBeDefined();

        const hotkey: StatefulViewHotkey = {
            ...command!.hotkeys[0],
            key: 'x',
            modifiers: ['Alt'],
            string_representation: 'XAlt',
        };
        updateViewHotkeysDictionary([
            {
                ...command!,
                group: '导航',
                hotkeys: [hotkey],
            } as StatefulViewCommand,
        ]);

        const resolved = viewHotkeys.current[hotkeyToString(hotkey)];
        expect(resolved.name).toBe('jump_core_next');

        const focusNx9Page = vi.fn();
        resolved.callback(
            {
                getMandalaSceneKey: () => ({
                    viewKind: 'nx9',
                    variant: 'default',
                }),
                focusNx9Page,
                mandalaWeekAnchorDate: null,
                viewStore: {
                    dispatch: vi.fn(),
                },
            } as never,
            {
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
            } as never,
        );

        expect(focusNx9Page).toHaveBeenCalledWith('next');
    });
});
