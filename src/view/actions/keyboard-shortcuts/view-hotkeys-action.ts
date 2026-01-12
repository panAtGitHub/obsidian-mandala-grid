import { LineageView } from 'src/view/view';
import { eventToString } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/event-to-string';
import { viewHotkeys } from 'src/view/actions/keyboard-shortcuts/helpers/commands/update-view-hotkeys-dictionary';
import { handleEscapeKey } from 'src/view/actions/on-escape/helpers/handle-escape-key';
import { onPluginError } from 'src/lib/store/on-plugin-error';
import { isEditing } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/is-editing';

export const viewHotkeysAction = (
    target: HTMLElement,
    {
        view,
    }: {
        view: LineageView;
    },
) => {
    const state = {
        shift: false,
    };
    const keyboardEventHandler = (event: KeyboardEvent) => {
        const command = viewHotkeys.current[eventToString(event)];
        if (command) {
            const allow =
                command.editorState === 'editor-on'
                    ? isEditing(view)
                    : command.editorState === 'editor-off'
                        ? !isEditing(view)
                        : true;

            if (allow) {
                try {
                    command.callback(view, event);
                    return; // 如果执行了命令，直接返回
                } catch (error) {
                    onPluginError(error, 'command', command);
                }
            }
        }

        // 如果没有匹配到命令，或者是 Escape 键
        if (event.key === 'Escape') {
            const contain = handleEscapeKey(view);
            if (contain) return;
        }

        // 仅在没有匹配到命令时拦截输入控件
        if (
            (event.target as HTMLElement).localName === 'input' ||
            (event.target as HTMLElement).localName === 'textarea' ||
            (event.target as HTMLElement).isContentEditable
        )
            return;
        if (event.shiftKey !== state.shift) {
            state.shift = event.shiftKey;
            view.viewStore.dispatch({
                type: event.shiftKey
                    ? 'view/keyboard/shift/down'
                    : 'view/keyboard/shift/up',
            });
        }
    };

    const onKeyup = (event: KeyboardEvent) => {
        if (event.shiftKey !== state.shift) {
            state.shift = event.shiftKey;
            view.viewStore.dispatch({
                type: event.shiftKey
                    ? 'view/keyboard/shift/down'
                    : 'view/keyboard/shift/up',
            });
        }
    };
    target.addEventListener('keydown', keyboardEventHandler);
    target.addEventListener('keyup', onKeyup);

    return {
        destroy: () => {
            target.removeEventListener('keydown', keyboardEventHandler);
            target.removeEventListener('keyup', onKeyup);
        },
    };
};
